// use strict mode
"use strict"

// requires
// models
const Settings = require("../models/Settings.model");

// white list
const ALLOWED_FIELDS = [
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

// functions
// get settings
const getSettings = async () => {
    // create or get settings (singleton)
    const settings = await Settings.getOrCreate();

    // return
    return settings;
};

// update the settings
const updateSettings = async (updates, actorId, ipAddress, userAgent) => {
    const settings = await Settings.getOrCreate();
    const before = {};
    const after = {};

    for (const key of ALLOWED_FIELDS) {
        if (updates[key] !== undefined) {
            before[key] = settings[key];
            settings[key] = updates[key];
            after[key] = updates[key];
        }
    }

    // saveing
    await settings.save();

    // use audit service
    await auditService.log({
        actorId: actorId,
        action: "SETTINGS_UPDATED",
        resource: "Settings",
        resourceId: settings._id,
        changes: { before, after },
        ipAddress: ipAddress,
        userAgent: userAgent,
    });

    // return
    return settings;
};

// exporting
module.exports = { getSettings, updateSettings };