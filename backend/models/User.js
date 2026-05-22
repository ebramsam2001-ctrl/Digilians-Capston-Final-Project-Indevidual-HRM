// mongoose
const mongoose = require("mongoose");

// mongoose schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, `email is required`],
        unique: [true, `email must be unique`],
        trim: true,
        lowercase: true,
    },
    passwordHashed: {
        type: String,
        required: [true, `passwordHashed is required`],
    },
    role: {
        type: String,
        required: [true, `role is required`],
        enum: {
            values: [`hr_admin`, `employee`],
            message: `{Value} is not a valid role`,
        },
        default: `employee`,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// model creation
const User = mongoose.model(`User`, userSchema);

// exporting
module.exports = User;