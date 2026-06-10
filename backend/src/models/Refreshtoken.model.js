// use use strict mode
"use strict"

// requires
const mongoose = require("mongoose");

// mongoose schema
const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `User`,
        required: [true, `userId is required`],
        index: true, // fast search
    },

    // sha-256
    tokenHash: {
        type: String,
        required: [true, `tokenHash is required`],
        unique: [true, `token must be unique`],
        index: true, // fast search
    },

    // ipAddress of the user that create the refresh token
    ipAddress: {
        type: String,
        default: null,
    },

    // session management
    userAgent: {
        type: String,
        default: null,
    },

    // expires at
    expiresAt: {
        type: Date,
        required: [true, `expiresAt is required`],
    },
}, { timestamps: true });

// TTL index (Database removes the token automatically after expiresAt)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// make the model
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

// exporting
module.exports = RefreshToken;