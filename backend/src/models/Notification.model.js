// use use strict mode
"use strict"

// requires
const mongoose = require("mongoose");

// mongoose schema
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, `userId is required`],
        index: true, // for speed
    },
    type: {
        type: String,
        enum: {
            values: [
                `leave_approved`,
                `leave_rejected`,
                `leave_submitted`, // HR receives (employee submits)
                `payslip_available`,
                `late_alert`,
                `absent_alert`,
                `system`,
            ],
            message: `Invalid notification type.`,
        },
        required: [true, `type is required`],
    },
    message: {
        type: String,
        required: [true, `message is required`],
        trim: true,
        maxlength: [500, `message must be 500 characters or fewer.`],
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true, // for speed
    },
}, { timestamps: true });

// index
// list unread for user
notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1, // descending
});

// auto delete notifications older than 90 TTL
notificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

// make the model
const Notification = mongoose.model("Notification", notificationSchema);

// exporting
module.exports = Notification;