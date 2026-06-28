// use strict mode
"use strict"

// requires
// libraries
const PDFDocument = require("pdfkit");

// models
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");
const Payroll = require("../models/Payroll.model");
const Settings = require("../models/Settings.model");

// services
const auditService = require("./audit.service");

// utils
const { AppError } = require("../utils/helpers");

// standards
const HOURS_PER_DAY = 8;

// functions
// helper functions
// month label
const monthLabel = (year, month) => {
    // get the month
    const result = `${year}-${String(month).padStart(2, "0")}`;

    // return
    return result;
}

// first of month
const firstOfMonth = (year, month) => {
    // get the first day
    const result = new Date(
        Date.UTC(parseInt(year), // year
            (parseInt(month) - 1), // month
            1), // day
    );

    // return
    return result;
};

// get attendance summary
// for one employee for one month
const getAttendanceSummary = async (employeeId, monthStart) => {
    // get the end of the month
    const monthEnd = new Date(
        Date.UTC(
            monthStart.getUTCFullYear(),
            (monthStart.getUTCMonth() + 1),
            0, // the last day
            23, // hour
            59, // minutes
            59, // seconds
        ),
    );

    // get the records that is withen the month
    const records = await Attendance.find({
        employeeId: employeeId,
        date: {
            $gte: monthStart,
            $lte: monthEnd,
        },
    });

    // collect the summary
    const summary = {
        totalDays: records.length,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        totalLateMinutes: 0,
    };

    // records analysis
    records.forEach(record => {
        // check status
        if (record.status === "present") {
            summary.presentDays++;
        }

        if (record.status === "late") {
            summary.lateDays++;
            summary.totalLateMinutes += record.lateMinutes;
        }

        if (record.status === "absent") {
            summary.absentDays++;
        }

        if (record.status === "on_leave") {
            summary.onLeaveDays++;
        }
    });

    // return
    return summary;
};

// run payroll
// calculate and save the payroll for all employees
const runPayroll = async (year, month, processedBy, ipAddress, userAgent) => {
    // get the month label
    const label = monthLabel(year, month);

    // start of the month
    const monthStart = firstOfMonth(year, month);

    // check if payroll runs this month
    const existing = await Payroll.findOne({ month: label });

    // check if existing
    if (existing) {
        // throw error
        throw new AppError(
            `Payroll for ${label} has already been run.`,
            409,
        );
    }

    // get the setting
    const settings = await Settings.getOrCreate();

    // get the working days
    const WORKING_DAYS = settings.workingDaysPerMonth;

    // get all active employee
    const employees = await Employee.find({ employmentStatus: "active" });

    // check if no employee are active
    if (employees.length === 0) {
        throw new AppError(`No active employees found.`, 404);
    }

    const payrollDocs = [];

    // iterate over the employees
    for (const employee of employees) {
        // get the employee summary
        const summary = await getAttendanceSummary(employee._id, monthStart);

        // get the hourly and daily rating
        const hourlyRate = employee.basicSalary / (WORKING_DAYS * HOURS_PER_DAY);
        const dailyRate = employee.basicSalary / WORKING_DAYS;

        // salary deduction
        const lateDeduction = Math.round((summary.totalLateMinutes / 60) * hourlyRate * 100) / 100;
        const absenceDeduction = Math.round(summary.absentDays * dailyRate * 100) / 100;
        const netSalary = Math.max(0, employee.basicSalary - lateDeduction - absenceDeduction);

        // push to the payrollDocs
        payrollDocs.push({
            employeeId: employee._id,
            month: label, // YYYY-MM string
            basicSalary: employee.basicSalary,
            lateDeduction: lateDeduction,
            absenceDeduction: absenceDeduction,
            bonus: 0,
            netSalary: netSalary,
            breakdown: {
                totalWorkingDays: WORKING_DAYS,
                presentDays: summary.presentDays,
                absentDays: summary.absentDays,
                lateDays: summary.lateDays,
                totalLateMinutes: summary.totalLateMinutes,
                approvedLeaveDays: summary.onLeaveDays,
            },
            status: "finalized",
            processedBy: processedBy,
        });
    }

    // Use Promise.allSettled for partial failure resilience
    const results = await Promise.allSettled(
        payrollDocs.map((doc) => {
            return Payroll.create(doc);
        }));

    const created = results.filter(result => result.status === "fulfilled")
        .map(result => result.value);

    const failed = results.filter(result => result.status === "rejected");

    // use audit service
    await auditService.log({
        actorId: processedBy,
        action: "PAYROLL_RUN",
        resource: "Payroll",
        changes: {
            month: label,
            employeesProcessed: created.length,
            failed: failed.length,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
    });

    // return
    return {
        month: label,
        employeesCount: created.length,
        failed: failed.length,
        payroll: created,
    };
};

// get payroll history
// the history of payroll of one employee
const getPayrollHistory = async (employeeId, { page = 1, limit = 12 } = {}) => {
    // make more than one query in the same time
    const [records, total] = await Promise.all([
        Payroll.find({ employeeId: employeeId })
            .populate("employeeId", "firstName lastName employeeCode")
            .sort({ month: -1 }) // Desending
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit)),
        // employee count
        Payroll.countDocuments({ employeeId: employeeId }),
    ]);

    // return
    return {
        records: records,
        pagination: {
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

// get payroll by ID
// get the employee payroll
const getPayrollById = async (id) => {
    // get the payroll
    const record = await Payroll.findById(id)
        .populate("employeeId", "firstName lastName employeeCode department jobTitle basicSalary")
        .populate("processedBy", "email");

    // check if id doesn't exist
    if (!record) {
        // throw error
        throw new AppError(`Payroll record not found.`, 404);
    }

    // return
    return record;
};

// generate payslip PDF
// PDF (Generate & Download Payslip PDF)
const generatePayslipPDF = async (payrollId, res) => {
    // get the employee payroll record
    const record = await getPayrollById(payrollId);

    // employee
    const employee = record.employeeId; // populated

    // get the month with format
    const month = record.month; // ISO format -> slice -> MM-YYYY

    // make the PDF document
    const doc = new PDFDocument({ margin: 50 });

    // set response headers so the browser downloads it as a file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="payslip-${employee.employeeCode}-${month}.pdf"`);

    // to fast response
    doc.pipe(res);

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("HRM Pro", { align: "center" });
    doc.fontSize(14).font("Helvetica").text("Monthly Payslip", { align: "center" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Employee info
    doc.fontSize(12).font("Helvetica-Bold").text("Employee Information");
    doc.font("Helvetica");
    doc.text(`Name:           ${employee.firstName} ${employee.lastName}`);
    doc.text(`Employee Code:  ${employee.employeeCode}`);
    doc.text(`Department:     ${employee.department}`);
    doc.text(`Job Title:      ${employee.jobTitle}`);
    doc.text(`Pay Period:     ${month}`);
    doc.moveDown();

    // Attendance
    const b = record.breakdown;
    doc.font("Helvetica-Bold").text("Attendance Summary");
    doc.font("Helvetica");
    doc.text(`Present Days:   ${b.presentDays}`);
    doc.text(`Late Days:      ${b.lateDays}  (${b.totalLateMinutes} minutes)`);
    doc.text(`Absent Days:    ${b.absentDays}`);
    doc.text(`On Leave Days:  ${b.approvedLeaveDays}`);
    doc.moveDown();

    // Salary
    doc.font("Helvetica-Bold").text("Salary Breakdown");
    doc.font("Helvetica");
    doc.text(`Basic Salary:         EGP ${record.basicSalary.toFixed(2)}`);
    doc.text(`Late Deduction:       EGP -${record.lateDeduction.toFixed(2)}`);
    doc.text(`Absence Deduction:    EGP -${record.absenceDeduction.toFixed(2)}`);
    doc.text(`Bonus:                EGP +${record.bonus.toFixed(2)}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(14).font("Helvetica-Bold")
        .text(`NET SALARY:  EGP ${record.netSalary.toFixed(2)}`, { align: "right" });

    // Footer
    doc.moveDown(3);
    doc.fontSize(9).font("Helvetica").fillColor("grey")
        .text(`Generated by HRM Pro on ${new Date().toISOString()}`, { align: "center" });

    doc.end();
};

// exporting
module.exports = {
    runPayroll,
    getPayrollHistory,
    getPayrollById,
    generatePayslipPDF,
};