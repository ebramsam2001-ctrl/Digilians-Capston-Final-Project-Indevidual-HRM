// use strict mode
"use strict"

// requires
// models
const Employee = require("../models/Employee.model");

// services
const leaveService = require("../services/leave.service");
const notificationService = require("../services/notification.service");

// utils
const { asyncHandler, AppError, sendSuccess } = require("../utils/helpers");

// functions
// submit leave
const submitLeave = asyncHandler(async (req, res) => {
    // get the employee by ID
    const employee = await Employee.findOne({ userId: req.userId });

    // check if employee exist
    if(!employee) {
        // throw error
        throw new AppError(`Employee not found.`, 404);
    }

    // use the submit service
    const request = await leaveService.submitLeave(employee._id, req.body);

    // send notification
    try {
        await notificationService.createNotification(
            req.userId,
            "system",
            `Your ${request.leaveType} leave request (${request.durationDays} day(s)) has been submitted and is pending approval.`,
            { leaveId: request._id },
        );
    } catch (error) {
        // silent — notification failure must not fail the approval
    }

    // return
    return sendSuccess(res, { request }, "Leave request submitted.", 201);
});

// list leaves
const listLeaves = asyncHandler(async (req, res) => {
    // get the data from the req.query
    const { status, employeeId, page, limit } = req.query;

    // for employees, scope to their own ID automatically
    let scopedEmployeeId = employeeId;
    if(req.role === "employee") {
        // get the employee by ID
        const employee = await Employee.findOne({ userId: req.userId }).select("_id");

        scopedEmployeeId = employee?._id;
    }

    // using the list leave service
    const result = await leaveService.listLeaves({
        role: req.role,
        employeeId: scopedEmployeeId,
        status: status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
    });

    // return
    return sendSuccess(res, result, `Leave requests fetched successfully.`);
});

// approve leave
const approveLeave = asyncHandler(async (req, res) => {
    // use approve leave service
    const request = await leaveService.approveLeave(req.params.id, req.userId);

    // get employee by ID
    const employee = await Employee.findById(request.employeeId)
                                   .select("userId firstName lastName");

    // create notification
    if(employee?.userId) {
        try {
            await notificationService.createNotification(
                employee.userId,
                "leave_approved",
                `Your ${request.leaveType} leave request (${request.durationDays} day(s)) has been approved.`,
                { leaveId: request._id },
            );
        } catch (error) {
            // silent — notification failure must not fail the approval
        }
    }

    // return
    return sendSuccess(res, { request }, `Leave request approved.`);
});

// reject leave
const rejectLeave = asyncHandler(async (req, res) => {
    // get reviewNote
    const { reviewNote } = req.body;

    // use reject leave
    const request = await leaveService.rejectLeave(req.params.id, req.userId, reviewNote);

    // get employee by ID
    const employee = await Employee.findById(request.employeeId)
                                   .select("userId");

    // create notification
    if(employee?.userId) {
        try {
            await notificationService.createNotification(
                employee.userId,
                "leave_rejected",
                `Your ${request.leaveType} leave request has been rejected.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
                { leaveId: request._id },
            );
        } catch (error) {
            // silent — notification failure must not fail the approval
        }
    }
});

// cancel leave
const cancelLeave = asyncHandler(async (req, res) => {
    // get the employee by ID
    const employee = await Employee.findOne({ userId: req.userId })
                                   .select("_id");

    // check if the employee exist
    if(!employee) {
        // throw error
        throw new AppError(`Employee profile not found.`, 404);
    }

    // use cancel leave service
    const request = await leaveService.cancelLeave(req.params.id, employee._id);

    // return
    return sendSuccess(res, { request }, `Leave request cancelled.`);
});

// exporting
module.exports = {
    submitLeave,
    listLeaves,
    approveLeave,
    rejectLeave,
    cancelLeave,
};