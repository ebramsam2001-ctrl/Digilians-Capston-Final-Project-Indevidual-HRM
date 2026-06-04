// use use strict mode
"use strict"

// requires
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// mongoose schema
const employeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, `userId is required`],
        unique: [true, `userId must be unique`],
    },
    employeeCode: {
        type: String,
        required: [true, `employeeCode is required`],
        unique: [true, `employeeCode must be unique`],
        trim: true,
    },
    firstName: {
        type: String,
        required: [true, `firstName is required`],
        trim: true,
    },

    lastName: {
        type: String,
        required: [true, `lastName is required`],
        trim: true,
    },

    phone: {
        type: String,
        required: [true, `phone is required`],
        trim: true,
    },
    department: {
        type: String,
        required: [true, `department is required`],
        trim: true,
    },
    jobTitle: {
        type: String,
        required: [true, `jobTitle is required`],
        trim: true,
    },
    basicSalary: {
        type: Number,
        required: [true, `basicSalary is required`],
        min: 0,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    employmentStatus: {
        type: String,
        enum: [
            "active",
            "on_leave",
            "terminated",
            "resigned"
        ],
        default: "active",
    },
    photoFileName: {
        type: String,
        default: null, // for check if the user uplode a photo or not
    },
    location: {
        type: String,
        default: null,
    },
    emergencyContact: {
        name: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            default: null,
        },
        relationship: {
            type: String,
            default: null,
        },
    },
    leaveBalance: {
        annual: {
            type: Number,
            default: 21,
            min: 0,
        },
        sick: {
            type: Number,
            default: 14,
            min: 0,
        },
    },
}, { timestamps: true });

// make virtual field "fullname"
employeeSchema.virtual(`fullName`) // field name
              .get(function() {
                return `${this.firstName} ${this.lastName}`;
              });

// Improving search efficiency
employeeSchema.index({
    employeeCode: 1,
});

employeeSchema.index({
    department: 1, // Ascending
});

employeeSchema.index({
    employmentStatus: 1, // Active
});

employeeSchema.index({
    firstName: "text",
    lastName: "text",
    employeeCode: "text",
});

// model creation
const Employee = mongoose.model(`Employee`, employeeSchema);

// exporting
module.exports = Employee;