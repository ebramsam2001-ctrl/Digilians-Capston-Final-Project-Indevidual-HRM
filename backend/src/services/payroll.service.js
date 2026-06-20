// use use strict mode
"use strict"

// requires
// libraries
const PDFDocument = require("pdfkit");

// models
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");
const Payroll = require("../models/Payroll.model");


// utils
const { AppError } = require("../utils/helpers");

// standards
const WORKING_DAYS = parseInt(process.env.WORKING_DAYS_PER_MONTH, 10) || 22;
const HOURS_PER_DAY = 8;

// functions
// helper functions
const firstOfMonth = (year, month) => {
    return new Date(
        Date.UTC(parseInt(year), // year
            (parseInt(month) - 1), // month
            1), // day
    );
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
    });

    // return
    return summary;
};

// run payroll
// calculate and save the payroll for all employees
const runPayroll = async (year, month, processedBy) => {
    // start of the month
    const monthStart = firstOfMonth(year, month);

    // check if payroll runs this month
    const existing = await Payroll.findOne({ month: monthStart });

    // check if existing
    if (existing) {
        // throw error
        throw new AppError(
            `Payroll for ${year}-${String(month).padStart(2, "0")} has already been run.`,
            409,
        );
    }

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

        // get the employee basicSalary
        const basicSalary = employee.basicSalary;

        // get the hourly and daily rating
        const hourlyRate = basicSalary / (WORKING_DAYS * HOURS_PER_DAY);
        const dailyRate = basicSalary / WORKING_DAYS;

        // salary deduction
        const lateDeduction = Math.round((summary.totalLateMinutes / 60) * hourlyRate * 100) / 100;
        const absenceDeduction = Math.round(summary.absentDays * dailyRate * 100) / 100;
        const netSalary = Math.max(0, (basicSalary - lateDeduction - absenceDeduction));

        // push to the payrollDocs
        payrollDocs.push({
            employeeId: employee._id,
            month: monthStart,
            basicSalary: basicSalary,
            lateDeduction: lateDeduction,
            absenceDeduction: absenceDeduction,
            bonus: 0,
            netSalary: netSalary,
            attendanceSummary: summary,
            status: "draft",
            processedBy: processedBy,
        });
    }

    // make insert all records at once
    const result = await Payroll.insertMany(payrollDocs);

    // return
    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        employeesCount: result.length,
        payroll: result,
    };
};

// get payroll history
// the history of payroll of one employee
const getPayrollHistory = async (employeeId, { page = 1, limit = 12 }) => {
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
    const employee = record.employeeId;

    // get the month with format
    const month = record.month.toISOString().slice(0, 7); // ISO format -> slice -> MM-YYYY

    // make the PDF document
    const document = new PDFDocument({ margin: 50 });

    // set response headers so the browser downloads it as a file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="payslip-${employee.employeeCode}-${month}.pdf"`, // the name form of the PDF
    );

    // to fast response
    document.pipe(res);

    // Headers
    document.fontSize(22).font("Helvetica-Bold").text("HRM Pro", { align: "center" });
    document.fontSize(14).font("Helvetica").text("Monthly Payslip", { align: "center" });
    document.moveDown();
    document.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    document.moveDown();

    // Employee info
    document.fontSize(12).font("Helvetica-Bold").text("Employee Information");
    document.font("Helvetica");
    document.text(`Name:           ${emp.firstName} ${emp.lastName}`);
    document.text(`Employee Code:  ${emp.employeeCode}`);
    document.text(`Department:     ${emp.department}`);
    document.text(`Job Title:      ${emp.jobTitle}`);
    document.text(`Pay Period:     ${month}`);
    document.moveDown();

    // Attendance summary
    const s = record.attendanceSummary;
    document.font("Helvetica-Bold").text("Attendance Summary");
    document.font("Helvetica");
    document.text(`Present Days:       ${s.presentDays}`);
    document.text(`Late Days:          ${s.lateDays}  (${s.totalLateMinutes} minutes late total)`);
    document.text(`Absent Days:        ${s.absentDays}`);
    document.moveDown();
 
    // Salary breakdown
    document.font("Helvetica-Bold").text("Salary Breakdown");
    document.font("Helvetica");
    document.text(`Basic Salary:       EGP ${record.basicSalary.toFixed(2)}`);
    document.text(`Late Deduction:     EGP -${record.lateDeduction.toFixed(2)}`);
    document.text(`Absence Deduction:  EGP -${record.absenceDeduction.toFixed(2)}`);
    document.text(`Bonus:              EGP +${record.bonus.toFixed(2)}`);
    document.moveDown();
    document.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    document.moveDown();
 
    document.fontSize(14).font("Helvetica-Bold")
       .text(`NET SALARY:  EGP ${record.netSalary.toFixed(2)}`, { align: "right" });
 
    // Footer
    document.moveDown(3);
    document.fontSize(9)
            .font("Helvetica")
            .fillColor("grey")
            .text(
                `Generated by HRM Pro on ${new Date().toISOString()}`,
                { align: "center" }
            );
 
    document.end();
};

// exporting
module.exports = {
    runPayroll,
    getPayrollHistory,
    getPayrollById,
    generatePayslipPDF,
};