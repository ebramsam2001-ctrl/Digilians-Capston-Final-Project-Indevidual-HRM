// use strict mode
"use strict"

// requires
// models
const Settings = require("../models/Settings.model");

// functions
// get settings
const getSettings = async () => {
    // create or get settings (singleton)
    const settings = await Settings.getOrCreate();

    // return
    return settings;
};

// update the settings
const updateSettings = async (updates) => {
    // whitelist only the fields that HR Admin is allowed to change
    const allowed = [
        "companyName",
        "standardStartTime",
        "standardHoursPerDay",
        "graceMinutes",
        "annualLeaveDays",
        "sickLeaveDays",
        "workingDaysPerMonth",
        "companyEmail",
        "companyPhone",
        "companyAddress",
    ];

    // build a safe update object (no unknown fields)
    const safeUpdates = {};
    for(const key of allowed) {
        if(updates[key] !== undefined) {
            safeUpdates[key] = updates[key];
        }
    }

    // get current singleton — creates it if it does not exist
    const settings = await Settings.getOrCreate();

    // apply updates
    Object.assign(settings, safeUpdates);

    // save
    await settings.save();

    // return
    return settings();
};

// exporting
module.exports = { getSettings, updateSettings };