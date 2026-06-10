// use strict mode
"use strict";

// requires
const mongoose = require("mongoose");

// mongoose schema
const leaveRequestSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `Employee`,
        required: [true, `employeeId is required`],
        index: true, // speed searching
    },
    leaveType: {
        type: String,
        enum: {
            values: [`annual`, `sick`, `unpaid`, `other`],
            message: `leaveType is invalid`,
        },
    },
    startDate: {
        type: Date,
        required: [true, "startDate is required"],
    },
    endDate: {
        type: Date,
        required: [true, "endDate is required"],
    },
    durationDays: {
        type: Number,
        required: [true, "durationDays is required"],
        min: [1, "Duration must be at least 1 day."],
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [500, "Reason must be 500 characters or fewer."],
        default: null,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled"],
        default: "pending",
        index: true,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [300, "Rejection reason must be 300 characters or fewer."],
        default: null,
    },
}, { timestamps: true });

// index
// HR (show the requist that is pending)
leaveRequestSchema.index({ status: 1, startDate: 1 });

// employee (show his requist by date)
leaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

// get by status (descending)
leaveRequestSchema.index({ status: 1, createdAt: -1 });

// make the model
const LeaveRequest = mongoose.model(`LeaveRequest`, leaveRequestSchema);

// exporting
module.exports = LeaveRequest;