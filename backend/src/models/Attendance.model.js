// use strict mode
"use strict"

// requires
const mongoose = require("mongoose");

// mongoose schema
const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `Employee`,
        required: [true, `employeeId is required`],
        index: true, // spead search
    },
    date: {
        type: Date,
        required: [true, `date is required`],
    },
    checkIn: {
        type: Date,
        default: null,
    },
    checkOut: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: [`present`, `late`, `absent`, `on_leave`],
        default: `absent`,
    },
    // minuts after the company start at 09:00 AM
    lateMinutes: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Total minutes worked = checkOut - checkIn
    workedMinutes: {
        type: Number,
        default: null,
    },
    processedByJob: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// ignore duplicate records per day
attendanceSchema.index({ employeeId: 1, data: 1, }, { unique: true });

// monthly history queries for a single employee
attendanceSchema.index({ employeeId: 1, date: -1 });

// search by date and status
attendanceSchema.index({ data: 1, status: 1 });

// make the model
const Attendance = mongoose.model("Attendance", attendanceSchema);

// exporting
module.exports = Attendance;