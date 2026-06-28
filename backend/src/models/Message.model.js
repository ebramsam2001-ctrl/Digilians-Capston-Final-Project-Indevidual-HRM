// use strict mode
"use strict";

// requires
const mongoose = require("mongoose");

// mongoose schema
const messageSchema = new mongoose.Schema({
    // The two participants — always stored sorted so (A→B) and (B→A)
    // resolve to the same conversation.
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, `sender is required`],
        index: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, `receiver is required`],
        index: true,
    },
    content: {
        type: String,
        required: [true, `content is required`],
        trim: true,
        maxlength: [2000, `Message must be 2000 characters or fewer.`],
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Indexes
// Fetch conversation between two users
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Unread count for a user
messageSchema.index({ receiver: 1, isRead: 1 });

// Auto-delete messages older than 180 days
messageSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 180 * 24 * 60 * 60 } // 180 days | 6 months
);

// model
const Message = mongoose.model("Message", messageSchema);

// exporting
module.exports = Message;