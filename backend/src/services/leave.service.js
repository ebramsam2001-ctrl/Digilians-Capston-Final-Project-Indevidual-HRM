// use strict mode
"use strict"

// requires
// libraries
const mongoose = require("mongoose");

// models
const LeaveRequest = require("../models/LeaveRequest.model");
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");

// utils
const { AppError } = require("../utils/helpers");

// functions
// leave request
// don't deduct vacation days for weekend leave
const countBusinessDays = (start, end) => {
    // count of Business days
    let count = 0;
    
    // get start and end time of date from 00:00:00 to 23:59:59:999
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    // iterate from current to end date to check weekend days
    while(current <= endDate) {
        const day = current.getUTCDay(); // 0 = sunday | 6 = saturday

        // check if day not (saturday, sunday)
        if(day !== 0 && day !== 6) {
            count++;
        }

        // go to the next day
        current.setUTCDate(current.getUTCDate() + 1);
    }

    // return
    return count;
};

// submit leave
// set to database the vacation days
const submitLeave = async (employeeId, { leaveType, startDate, endDate, reason }) => {
    // get employee by ID
    const employee = await Employee.findById(employeeId);

    // check if employee not exist
    if(!employee) {
        // throw error
        throw new AppError(`Employee not found.`, 404);
    }

    // check if he is active
    if(employee.employmentStatus !== "active") {
        // throw error
        throw new AppError(`employees is not active`, 403);
    }

    // define the start and end date of leave
    const start = new Date(startDate);
    const end = new Date(endDate);

    // check if "end" not before "start"
    if(end < start) {
        // throw error
        throw new AppError(`Dates error`, 400);
    }

    // duration days (get the count of days in leave)
    const durationDays = countBusinessDays(start, end);

    // check if duration days < 1
    if(durationDays < 1) {
        // throw error
        throw new AppError(`Leave must include at least 1 business day.`, 400);
    }

    // check leave creadit
    // are there enough vacation days left?
    // for annual
    if(leaveType === "annual" && employee.leaveBalance.annual < durationDays) {
        // throw error
        throw new AppError(
            `Insufficient annual leave balance. Available: ${employee.leaveBalance.annual} day(s).`,
            400
        );
    }

    // for annual
    if(leaveType === "sick" && employee.leaveBalance.sick < durationDays) {
        // throw error
        throw new AppError(
            `Insufficient sick leave balance. Available: ${employee.leaveBalance.sick} day(s).`,
            400
        );
    }

    // check for overlaping in preavious requistes
    const overlap = await LeaveRequest.findOne({
        employeeId: employeeId,
        status: { $in: [ "pending", "approved" ] },
        startDate: { $lte: end },
        endDate: { $gte: start },
    });

    // check if overlaped
    if(overlap) {
        // throw error
        throw new AppError(`You already have a leave request that overlaps with these dates.`, 409);
    }
    
    // request creation
    const request = await LeaveRequest.create({
        employeeId: employeeId,
        leaveType: leaveType,
        startDate: start,
        endDate: end,
        durationDays: durationDays,
        reason: reason || null,
    });

    // return
    return request;
};

// pagination
// list leave (admin -> all) (employee -> its own)
const listLeaves = async ({ role, employeeId, status, page = 1, limit = 20 }) => {
    // make the object to add the options of the searching
    const query = {};

    // check the role
    if(role === "employee") { // for employees
        query.employeeId = employeeId;
    } else if(employeeId) { // for HR to get spicific employee leaves
        query.employeeId = employeeId;
    }

    // check if status define
    if(status) {
        query.status = status;
    }

    // skip: the number of leaves that the database should be skip
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // make more than one query in the same time
    const [requests, total] = await Promise.all([
        LeaveRequest.find(query)
                    .populate("employeeId", "firstName lastName employeeCode department")
                    .populate("reviewedBy", "email")
                    .sort({ createdAt: -1 }) // Desending
                    .skip(skip)
                    .limit(parseInt(limit)), 
        // employee count
        LeaveRequest.countDocuments(query),
    ]);

    // return
    return {
        requests: requests,
        pagination: {
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

// approve leave
// Deducting vacation balance,
// updating application status,
// and modifying employee attendance and departure schedule
const approveLeave = async (leaveId, reviewerUserId) => {
    // make (MongoDB Transactions)
    // to make (All or Nothing) can not make 1 operation without another operation 

    // create session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // get the request by ID
        // make it when the transaction is over
        const request = await LeaveRequest.findById(leaveId).session(session);

        // check if leave not exist
        if(!request) {
            // throw error
            throw new AppError(`Leave request not found.`, 404);
        }

        // check if leave status is not pending
        if(request.status !== "pending") {
            // throw error
            throw new AppError(`Cannot approve a request`, 400);
        }

        // get the employee to make self-Approval Prevention
        // make it when the transaction is over
        const employee = await Employee.findById(request.employeeId).session(sessoin);

        // check if employee is not exist
        if(!employee) {
            // throw error
            throw new AppError(`Employee not found.`, 404);
        }

        // check if employee Id != reviewerId
        if(employee.userId.toString() === reviewerUserId.toString()) {
            // throw error
            throw new AppError(`You cannot approve your own leave request.`, 403);
        }

        // leave balance (only for "annual" and "sick")
        // this for deducting from vacation balance
        if(["annual", "sick"].includes(request.leaveType)) {
            // make (eg. "leaveBalance.annual")
            const balanceField = `leaveBalance.${request.leaveType}`;

            // update employee (- durationDays)
            const update = await Employee.findOneAndUpdate(
                {
                    _id: request.employeeId,
                    [balanceField]: { $gte: request.durationDays }, // no - balance
                },
                { $inc: { [balanceField]: -request.durationDays } },
                {
                    new: true,
                    session: session,
                },
            );

            // check if employee Insufficient to take this leave
            if(!update) {
                // throw error
                throw new AppError(`Insufficient leave balance at time of approval.`, 400);
            }
        }

        // update request
        request.status = "approved";
        request.reviewedBy = reviewerUserId;
        request.reviewedAt = new Date();
        
        // saveing
        await request.save({ session: session });

        // get the start and the end of leave
        const current = new Date(request.startDate);
        const end = new Date(request.endDate);

        // change the status in the dayes of leave to "on_leave" (ignor the weekend days)
        while(current <= end) {
            // get the day
            const day = current.getUTCDay();

            // skip weekends (0 = sunday | 6 = saturday)
            if(day !== 0 && day !== 6) {
                // get date
                const dayStart = new Date(Date.UTC(
                    current.getUTCFullYear(),
                    current.getUTCMonth(),
                    current.getUTCDate(),
                ));

                // update
                await Attendance.findByIdAndUpdate(
                    {
                        employeeId: request.employeeId,
                        date: dayStart,
                    },
                    { $set: { status: "on_leave" } },
                    {
                        upsert: true, // to ignore if the attendance of the day not maked, make it
                        session: session,
                    }
                );
            }

            // increment day (day++)
            current.setUTCDate(current.getUTCDate() + 1);
        }

        // commit session and make the transaction
        await session.commitTransaction();

        // return
        return request;
    } catch (error) {
        // cancel the transaction
        await session.abortTransaction();

        // throw error
        throw error;
    } finally {
        // end the session
        session.endSession();
    }
};

// reject leave
const rejectLeave = async (leaveId, reviewerUserId, reviewNote) => {
    // get the request by ID
    const request = await LeaveRequest.findById(leaveId);

    // check if request is not exist
    if(!request) {
        // throw error
        throw new AppError(`Leave request not found.`, 404);
    }

    // check if leave status is not pending
    if(request.status !== "pending") {
        // throw error
        throw new AppError(`Cannot reject a request`, 400);
    }

    // update the request
    request.status = "rejected";
    request.reviewedBy = reviewerUserId;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || null;

    // saving
    await request.save();

    // return
    return request;
};

// cancel leave (employee cancels their own pending request)
const cancelLeave = async (leaveId, employeeId) => {
    // get the request by ID
    const request = await LeaveRequest.findById(leaveId);

    // check if request is not existing
    if(!request) {
        // throw error
        throw new AppError(`Leave request not found.`, 404);
    }

    // check if the employee ID != request sender ID
    if(request.employeeId.toString() !== employeeId.toString()) {
        // throw error
        throw new AppError(`You can only cancel your own leave requests.`, 403);
    }

    // check if leave status is not pending
    if(request.status !== "pending") {
        // throw error
        throw new AppError(`Only pending requests can be cancelled.`, 400);
    }

    // update the request status
    request.status = "cancelled";

    // saving
    await request.save();

    // return
    return request;
};

// exporting
module.exports = {
    submitLeave,
    listLeaves,
    approveLeave,
    rejectLeave,
    cancelLeave,
};