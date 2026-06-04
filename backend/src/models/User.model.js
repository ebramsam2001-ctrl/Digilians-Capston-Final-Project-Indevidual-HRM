// use use strict mode
"use strict"

// requires
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { type } = require("os");

// mongoose schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, `email is required`],
        unique: [true, `email must be unique`],
        trim: true,
        lowercase: true,
        index: true, // Binary tree "Searching"
    },
    passwordHashed: {
        type: String,
        required: [true, `passwordHashed is required`],
        select: false,
        minlength: 8,
    },
    role: {
        type: String,
        required: [true, `role is required`],
        enum: {
            values: [`hr_admin`, `employee`, `super_admin`],
            message: `Not a valid role`,
        },
        default: `employee`,
    },
    accountStatus: {
        type: String,
        required: [true, `accountStatus is required`],
        enum: {
            values: [`active`, `suspended`, `locked`],
        },
        default: `active`,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
    passwordChangedAt: {
        type: Date,
    },
    // for password forget
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    loginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, { timestamps: true });

// Hook for hash the password if its not
userSchema.pre(`save`, async function(next) {
    if(!this.isModified(`passwordHashed`)) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHashed = await bcrypt.hash(this.passwordHashed, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// password change tracking
userSchema.pre(`save`, function(next) {
    if(!this.isModified(`passwordHashed` || this.isNew)) {
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000;

    next();
});

// make a new hook method for compare password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.passwordHashed);
}

// make a new hook method for create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString("hex"); // make token

    this.passwordResetToken = crypto.createHash("sha256") // hash
                                    .update(resetToken) // make token
                                    .digest("hex"); // hex
    this.passwordResetExpires = Date.now() + (10 * 60 * 1000); // 10 min
    
    return resetToken;
};

// model creation
const User = mongoose.model(`User`, userSchema);

// exporting
module.exports = User;