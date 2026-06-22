// use strict mode
"use strict"

// requires
const mongoose = require("mongoose");

// mongoose schema
const payrollSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: [true, "employeeId is required"],
        index: true,
    },
    // YYYY-MM (for duplicate detection)
    month: {
        type: String,
        required: [true, "month is required"],
        match: [/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM format."],
    },
    basicSalary: {
        type: Number,
        required: true,
        min: 0,
    },
    lateDeduction: {
        type: Number,
        default: 0,
        min: 0,
    },
    absenceDeduction: {
        type: Number,
        default: 0,
        min: 0,
    },
    bonus: {
        type: Number,
        default: 0,
        min: 0,
    },
    // net = basicSalary - lateDeduction - absenceDeduction + bonus
    netSalary: {
        type: Number,
        required: true,
        min: 0,
    },
    // summary
    breakdown: {
        totalWorkingDays: {
            type: Number,
            default: 0
        },
        presentDays: {
            type: Number,
            default: 0
        },
        absentDays: {
            type: Number,
            default: 0
        },
        lateDays: {
            type: Number,
            default: 0
        },
        totalLateMinutes: {
            type: Number,
            default: 0
        },
        approvedLeaveDays: {
            type: Number,
            default: 0
        },
    },
    status: {
        type: String,
        enum: ["draft", "finalized"],
        default: "finalized",
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
});

// ignore duplicate records per month
payrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });

// make the model
const Payroll = mongoose.model(`Payroll`, payrollSchema);

// exporting
module.exports = Payroll;