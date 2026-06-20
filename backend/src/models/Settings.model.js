// use use strict mode
"use strict"

// requires
const mongoose = require("mongoose");

// mongoose schema
const settingsSchema = new mongoose.Schema({
    // organisation identity
    companyName: {
        type: String,
        required: [true, `companyName is required`],
        trim: true,
        maxlength: [150, `companyName must be 150 characters or less.`],
    },
    // attendance rules
    standardStartTime: {
        type: String,
        default: `09:00`,
        match: [/^\d{2}:\d{2}$/, `standardStartTime must be HH:MM format.`],
    },
    standardHoursPerDay: {
        type: Number,
        default: 8,
        min: [1, `standardHoursPerDay must be at least 1.`],
        max: [24, `standardHoursPerDay must be 24 or less.`],
    },
    graceMinutes: {
        type: Number,
        default: 15,
        min: [0, `graceMinutes cannot be negative.`],
    },
    // leave policies
    annualLeaveDays: {
        type: Number,
        default: 21,
        min: [0, `annualLeaveDays cannot be negative.`],
    },
    sickLeaveDays: {
        type: Number,
        default: 14,
        min: [0, `sickLeaveDays cannot be negative.`],
    },
    // payroll
    workingDaysPerMonth: {
        type: Number,
        default: 22,
        min: [1, `workingDaysPerMonth must be at least 1.`],
    },
    // company contact
    companyEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
    },
    companyPhone: {
        type: String,
        trim: true,
        default: null,
    },
    companyAddress: {
        type: String,
        trim: true,
        default: null,
    },
}, { timestamps: true });

// statics
// Singleton helper — always use getOrCreate()
// instead of Settings.create() directly
settingsSchema.statics.getOrCreate = async function () {
    // check if document alredy exist
    let document = await this.findOne();

    // make one create method in the hole app
    if(!document) {
        document = await this.create({ companyName: `HRM Pro Organisation` });
    }

    // return
    return document;
};

// make the model
const Settings = mongoose.model("Settings", settingsSchema);

// exporting
module.exports = Settings;