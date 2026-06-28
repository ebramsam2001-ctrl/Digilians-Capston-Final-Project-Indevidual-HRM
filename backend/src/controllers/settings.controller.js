// use strict mode
"use strict";

// requires
// utils
const { asyncHandler, sendSuccess } = require("../utils/helpers");

// services
const settingsService = require("../services/settings.service");

// functions
// get settings
const getSettings = asyncHandler(async (req, res) => {
    // use get settings service
    const settings = await settingsService.getSettings();

    // return
    return sendSuccess(res, { settings }, `Settings fetched successfully.`);
});

// update settings
const updateSettings = asyncHandler(async (req, res) => {
    // use update setting service
    const settings = await settingsService.updateSettings(
        req.body,
        req.userId,
        req.ip,
        req.headers["user-agent"],
    );

    // return
    return sendSuccess(res, { settings }, `Settings updated successfully.`);
});

// exporting
module.exports = { getSettings, updateSettings };