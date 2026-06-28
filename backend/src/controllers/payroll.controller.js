// use strict mode
"use strict"

// requires
// models
const Employee = require("../models/Employee.model");
const Payroll = require("../models/Payroll.model");

// services
const payrollService = require("../services/payroll.service");
const notificationService = require("../services/notification.service");
const auditService = require("../services/audit.service");

// utils
const { asyncHandler, AppError, sendSuccess } = require("../utils/helpers");

// functions
// run payroll
const runPayroll = asyncHandler(async (req, res) => {
    const { year, month } = req.body;

    if (!year || !month) {
        // throw error
        throw new AppError("year and month are required.", 400);
    }

    // use payroll run payroll service
    const result = await payrollService.runPayroll(
        year,
        month,
        req.userId,
        req.ip,
        req.headers["user-agent"],
    );

    // Notify all employees that their payslip is ready (best effort, fire-and-forget)
    Employee.find({ employmentStatus: "active" }).select("userId").then((employees) => {
        employees.forEach((employee) => {
            if (employee.userId) {
                notificationService.createNotification(
                    employee.userId,
                    "payslip_available",
                    `Your payslip for ${result.month} is now available.`,
                    { month: result.month },
                ).catch(() => { });
            }
        });
    }).catch(() => { });

    // return
    return sendSuccess(res, result, `Payroll for ${result.month} processed successfully.`, 201);
});

// list payroll
const listPayroll = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    // Employees can only see their own payroll
    if (req.role === "employee") {
        // get employee by ID
        const employee = await Employee.findOne({ userId: req.userId }).select("_id");

        // check if employee not exist
        if (!employee) {
            // throw error
            throw new AppError(`Employee profile not found.`, 404);
        }

        // use payroll get payroll history service
        const result = await payrollService.getPayrollHistory(employee._id, { page, limit });

        // return
        return sendSuccess(res, result, "Payroll history fetched.");
    }

    // HR Admin — list all, optionally filtered
    const { month, employeeId } = req.query;
    const query = {};
    if (month) query.month = month;
    if (employeeId) query.employeeId = employeeId;

    // pagination
    const take = Math.min(parseInt(limit) || 20, 100);
    const skip = (parseInt(page || 1) - 1) * take;

    // make more thane one operation in the same time
    const [records, total] = await Promise.all([
        Payroll.find(query)
            .populate("employeeId", "firstName lastName employeeCode department")
            .sort({ month: -1, createdAt: -1 })
            .skip(skip)
            .limit(take),
        // get payroll count
        Payroll.countDocuments(query),
    ]);

    // return
    return sendSuccess(
        res,
        {
            records: records,
            pagination: {
                total: total,
                page: parseInt(page || 1),
                limit: take,
            },
        },
        "Payroll records fetched.",
    );
});

// get payroll record
const getPayrollRecord = asyncHandler(async (req, res) => {
    // use payroll get payroll by ID service
    const record = await payrollService.getPayrollById(req.params.id);

    // Employees can only see their own payslip
    if (req.role === "employee") {
        // get employee by ID
        const employee = await Employee.findOne({ userId: req.userId }).select("_id");

        if (!employee || record.employeeId._id.toString() !== employee._id.toString()) {
            // throw error
            throw new AppError(`Not authorised.`, 403);
        }

        // Audit the view
        await auditService.log({
            actorId: req.userId,
            action: "PAYSLIP_VIEWED",
            resource: "Payroll",
            resourceId: record._id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });
    }

    // return
    return sendSuccess(res, { record }, "Payroll record fetched.");
});

const downloadPayslip = asyncHandler(async (req, res) => {
    // use payroll get payroll by ID service
    const record = await payrollService.getPayrollById(req.params.id);

    // Employees can only download their own payslip
    if (req.role === "employee") {
        // get employee by ID
        const employee = await Employee.findOne({ userId: req.userId }).select("_id");

        if (!employee || record.employeeId._id.toString() !== employee._id.toString()) {
            // throw error
            throw new AppError(`Not authorised.`, 403);
        }
    }

    // use payroll generate payslip PDF service
    await payrollService.generatePayslipPDF(req.params.id, res);
    // Response is piped directly — no sendSuccess needed
});

// exporting
module.exports = {
    runPayroll,
    listPayroll,
    getPayrollRecord,
    downloadPayslip,
};