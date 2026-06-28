// use strict mode
"use strict"

// requires
// models
const Employee = require("../models/Employee.model");

// services
const attendanceService = require("../services/attendance.service");

// utils
const { asyncHandler, AppError, sendSuccess } = require("../utils/helpers");

// functions
// clockIn
const clockIn = asyncHandler(async (req, res) => {
    // get the employee by ID
    const employee = await Employee.findOne({ userId: req.userId });

    // check if employee exist
    if (!employee) {
        // throw error
        throw new AppError(`Employee profile not found.`, 404);
    }

    // use attendance clockin service
    const record = await attendanceService.clockIn(employee._id);

    // return
    return sendSuccess(res, { record }, "Clocked in successfully.", 201);
});

// clockOut
const clockOut = asyncHandler(async (req, res) => {
    // get employee by ID
    const employee = await Employee.findOne({ userId: req.userId });

    // check if employee exist
    if (!employee) {
        // throw error
        throw new AppError(`Employee profile not found.`, 404);
    }

    // use attendance clockout service
    const record = await attendanceService.clockOut(employee._id);

    // return
    return sendSuccess(res, { record }, "Clocked out successfully.");
});

// list attendance
const listAttendance = asyncHandler(async (req, res) => {
    const { page, limit, dateFrom, dateTo, status, employeeId } = req.query;

    let scopedEmployeeId = employeeId;

    // Employees can only see their own records
    if (req.role === "employee") {
        const employee = await Employee.findOne({ userId: req.userId }).select("_id");
        if (!employee) throw new AppError("Employee profile not found.", 404);
        scopedEmployeeId = employee._id;
    }

    // use attendance list attendance service
    const result = await attendanceService.listAttendance({
        page: page,
        limit: limit,
        employeeId: scopedEmployeeId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        status: status,
    });

    // return
    return sendSuccess(res, result, "Attendance records fetched successfully.");
});

// get overview
const getOverview = asyncHandler(async (req, res) => {
    // use attendance get overview service
    const overview = await attendanceService.getOverview();

    // return
    return sendSuccess(res, { overview }, "Attendance overview fetched.");
});

const getMonthlyData = asyncHandler(async (req, res) => {
    const { year, month, employeeId } = req.query;

    if (!year || !month) {
        // throw error
        throw new AppError(`year and month query parameters are required.`, 400);
    }

    let targetEmployeeId = employeeId;

    // Employees always get their own data regardless of query param
    if (req.role === "employee") {
        const employee = await Employee.findOne({ userId: req.userId }).select("_id");
        if (!employee) throw new AppError("Employee profile not found.", 404);
        targetEmployeeId = employee._id;
    }

    if (!targetEmployeeId) {
        // throw error
        throw new AppError(`employeeId is required.`, 400);
    }

    // use attendance get monthly data
    const records = await attendanceService.getMonthlyData(targetEmployeeId, year, month);

    // return
    return sendSuccess(res, { records }, "Monthly attendance fetched.");
});

module.exports = {
    clockIn,
    clockOut,
    listAttendance,
    getOverview,
    getMonthlyData,
};