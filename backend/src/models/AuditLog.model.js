// use strict mode
"use strict";

// requires
const mongoose = require("mongoose");

// mongoose schema
const auditLogSchema = new mongoose.Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
    },
    actorEmail: {
        type: String,
        default: null,
    },
    actorRole: {
        type: String,
        default: null,
    },
    action: {
        type: String,
        required: [true, `action is required`],
        enum: [
            // Auth
            "LOGIN",
            "LOGOUT",
            "LOGIN_FAILED",
            "PASSWORD_RESET_REQUESTED",
            "PASSWORD_RESET_COMPLETED",
            "PASSWORD_CHANGED",
            "ACCOUNT_LOCKED",
            "TOKEN_REUSE_DETECTED",

            // Employee
            "EMPLOYEE_CREATED",
            "EMPLOYEE_UPDATED",
            "EMPLOYEE_DELETED",

            // Leave
            "LEAVE_SUBMITTED",
            "LEAVE_APPROVED",
            "LEAVE_REJECTED",
            "LEAVE_CANCELLED",

            // Payroll
            "PAYROLL_RUN",
            "PAYSLIP_VIEWED",

            // Settings
            "SETTINGS_UPDATED",

            // Role
            "ROLE_CHANGED",

            // System
            "CRON_ABSENCES_MARKED",
        ],
        index: true,
    },

    // The resource affected
    resource: {
        type: String,
        default: null,
    },

    // The _id of the affected document
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },

    // Snapshot of what changed (before/after or just the new state)
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // Network info
    ipAddress: {
        type: String,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },

    // Outcome
    status: {
        type: String,
        enum: ["success", "failure"],
        default: "success",
    },

    // Error message if status === "failure"
    errorMessage: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,

    // audit logs are immutable
    // disable versioning
    versionKey: false,
});

// Indexes
// recent activity feed
auditLogSchema.index({ createdAt: -1 });

// Filter by actor
auditLogSchema.index({ actorId: 1, createdAt: -1 });

// Filter by action type
auditLogSchema.index({ action: 1, createdAt: -1 });

// Filter by resource
auditLogSchema.index({ resource: 1, resourceId: 1 });

// Auto-delete logs older than 1 year
auditLogSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 365 * 24 * 60 * 60 } // 1 year
);

// model
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// exporting
module.exports = AuditLog;