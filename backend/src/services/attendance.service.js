// use strict mode
"use strict"

// requires
// models
const Attendance = require("../models/Attendance.model");
const Employee = require("../models/Employee.model");
const Settings = require("../models/Settings.model");

// utils
const { AppError } = require("../utils/helpers");

// today UTC
const todayUTC = () => {
    // get the time now
    const now = new Date();

    // get the date now with the UTC format
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // return the date with the UTC format
    return date;
};

// parse the time to object with { hours, minutes }
const parseTime = (str = "09:00") => {
    // split by ":" and parse it to integers
    const [hours, minutes] = str.split(":").map(Number);

    // return
    return {
        hours: hours,
        minutes: minutes,
    };
};

// calculate late minutes from check in date
const calculateLateMinutes = (checkInDate) => {
    // get start time in the company
    const start = parseTime(process.env.STANDARD_START_TIME || "09:00");

    // get the total minuts from the midnight (00:00)
    const startTotal = (start.hours * 60) + start.minutes;

    // get the total minuts from the midnight UTC (actual user login)
    const checkInTotal = checkInDate.getUTCHours() * 60 + checkInDate.getUTCMinutes;

    // the total late minuts
    // Math.max -> for not get (-) numbers as a result
    const totalLateMinutes = Math.max(0, (checkInTotal - startTotal));

    // return
    return totalLateMinutes;
};

// Attendance registration process for today
const clockIn = async (employeeId) => {
    // get today's date with UTC form
    const today = todayUTC();

    // get the time now
    const now = new Date();

    // check if attended today
    const existing = await Attendance.findOne({
        employeeId: employeeId,
        date: today,
    });

    // check if existing
    if (existing && existing.checkIn) {
        // throw error
        throw new AppError(`Already clocked in today.`, 409);
    }

    // Fetch grace minutes from settings
    const settings = await Settings.getOrCreate();
    const graceStart = parseTime(settings.standardStartTime);
    const graceTotal = (graceStart.hours * 60) + graceStart.minutes + settings.graceMinutes;
    const nowTotal = (now.getUTCHours() * 60) + now.getUTCMinutes();

    // Raw late minutes (negative = early)
    const rawLate = nowTotal - ((graceStart.hours * 60) + graceStart.minutes);

    // calculate late minuts if he is late
    const lateMinutes = nowTotal > graceTotal ? Math.max(0, rawLate) : 0;

    // get status
    const status = lateMinutes > 0 ? "late" : "present";

    // upsert (update and insert)
    const record = await Attendance.findByIdAndUpdate(
        {
            employeeId: employeeId,
            date: today,
        },
        {
            // to update this fields only not delete all fields and fill these only
            $set: {
                checkIn: now,
                status: status,
                lateMinutes: lateMinutes,
            },
        },
        {
            upsert: true, // if the document attendance of this day not created make it
            new: true,
        },
    );

    // return
    return record;
};

// Departure registration process
const clockOut = async (employeeId) => {
    // get today's date with UTC form
    const today = todayUTC();

    // get the time now
    const now = new Date();

    // get the attendance record for the employee by ID and today
    const record = await Attendance.findOne({
        employeeId: employeeId,
        date: today,
    });

    // check if no record today
    if (!record || !record.checkIn) {
        // throw error
        throw new AppError(`You have not clocked in today.`, 400);
    }

    // check if employee is Departure today
    if (record.checkOut) {
        // throw error
        throw new AppError(`Already clocked out today.`, 409);
    }

    // make the employee Departure
    record.checkOut = now;
    record.workedMinutes = Math.floor((now - record.checkIn) / (60 * 1000));

    // save
    await record.save();

    // return
    return record;
};

// pagination and Dynamic Query
// list attendance 
const listAttendance = async ({ page = 1, limit = 20, employeeId, dateFrom, dateTo, status }) => {
    // make the object to add the options of the searching
    const query = {};

    // check if employeeId is defind
    if (employeeId) {
        query.employeeId = employeeId;
    }

    // check if status is defind
    if (status) {
        query.status = status;
    }

    // check if dateFrom or dateTo is defind
    if (dateFrom || dateTo) {
        query.date = {};

        if (dateFrom) {
            query.date.$gte = new Date(dateFrom);
        }

        if (dateTo) {
            query.date.$lte = new Date(dateTo);
        }
    }

    // pagination
    // skip: the number of records that the database should be skip
    const skip = (parseInt(page) - 1) * parseInt(limit); // if it not a number

    // take: the number of records that actually get
    const take = Math.min(parseInt(limit), 100); // if it not a number

    // make more than one query in the same time
    const [records, total] = await Promise.all([
        // get records
        Attendance.find(query)
            .populate("employeeId", "firstName lastName employeeCode department")
            .sort({ date: -1 }) // Desending
            .skip(skip)
            .limit(take),
        // records count
        Attendance.countDocuments(query),
    ]);

    // return
    return {
        records: records,
        pagination: {
            total: total,
            page: parseInt(page), // if it not a number
            limit: take,
            totalPages: Math.ceil(total / take),
        },
    };
};

// make over view for HR dashboard summary (use MongoDB Aggregation Framework)
const getOverview = async () => {
    // get today's date with UTC form
    const today = todayUTC();

    // aggregation query
    const result = await Attendance.aggregate([
        { $match: { date: today } },
        {
            $group: {
                _id: "$status", // field in database it self
                count: { $sum: 1, },
            }
        },
    ]);

    // mapping the object for the stable format
    const counts = {
        present: 0,
        late: 0,
        absent: 0,
        on_leave: 0,
    };

    // fill the counts object
    result.forEach(({ _id, count }) => {
        counts[_id] = count;
    });

    // compute the active employee for compute "not active"
    const totalActive = await Employee.countDocuments({ employmentStatus: "active" });

    // return
    return {
        date: today,
        totalActive: totalActive,
        ...counts,
        notArrived: Math.max(
            0,
            totalActive - counts.present - counts.late - counts.on_leave - counts.absent
        ),
    };
};

// get the fully employee month attendance
const getMonthlyData = async (employeeId, year, month) => {
    // start date
    const start = new Date(Date.UTC(parseInt(year), // if not a number
        (parseInt(month) - 1), // the month number in os is start from 0
        1,)); // the 1st day in the month

    // end date
    const end = new Date(Date.UTC(parseInt(year), // if not a number
        parseInt(month),
        0, // the 1st day in the month (0 = last day)
        23, // hour
        59, // minuts
        29,)); // seconds

    // get the employee monthly report
    const records = await Attendance.find({
        employeeId: employeeId,
        date: {
            $gte: start,
            $lte: end,
        },
    }).sort({ date: 1, });

    // return
    return records;
};

// handel the absent employee automaticaly in 11:59 PM
const markAbsentees = async () => {
    // get the today day
    const today = todayUTC();

    // get all active employee
    const activeEmployees = await Employee.find({ employmentStatus: "active" }).select("_id");

    // get employee that have record today
    const existingIds = await Attendance.find({ date: today, }).distinct("employeeId"); // don't repeat employee

    // map every id in existing to string and make it in set to ignore the repeated employee (to make sure)
    const existingSet = new Set(existingIds.map(id => id.toString()));

    // get absence employee
    const absentRecords = activeEmployees.filter(employee => !existingSet.has(employee._id.toString())) // get the absent employee
        .map(employee => ({
            employeeId: employee._id,
            date: today,
            status: "absent",
            processedByJob: true, // automaticaly
        }));

    // check if are absents
    if (absentRecords.length > 0) {
        // ordered: false — continue inserting even if some fail (e.g. race condition)
        await Attendance.insertMany(absentRecords, { ordered: false }).catch((error) => {
            // Ignore duplicate key errors — they mean the record was already inserted
            if (error.code !== 11000 && error?.writeErrors?.some((err) => err.code !== 11000)) {
                throw error;
            }
        });
    }

    // return
    return { markedAbsent: absentRecords.length };
};

// exporting
module.exports = {
    clockIn,
    clockOut,
    listAttendance,
    getOverview,
    getMonthlyData,
    markAbsentees,
};