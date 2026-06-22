// use strict mode
"use strict"

// requires
// libraries
const { body } = require("express-validator");

// functions
// settings validators
const settingsValidators = [
    // companyName
    body("companyName")
        .optional()
        .isString().withMessage(`companyName must be a string.`)
        .trim()
        .notEmpty().withMessage(`companyName cannot be blank.`)
        .isLength({ max: 150 }).withMessage(`companyName must be 150 characters or fewer.`),

    // standardStartTime
    body("standardStartTime")
        .optional()
        .matches(/^\d{2}:\d{2}$/).withMessage("standardStartTime must be HH:MM format."),

    // standardHoursPerDay
    body("standardHoursPerDay")
        .optional()
        .isInt({ min: 1, max: 24 }).withMessage("standardHoursPerDay must be between 1 and 24.")
        .toInt(),

    // graceMinutes
    body("graceMinutes")
        .optional()
        .isInt({ min: 0, max: 120 }).withMessage("graceMinutes must be between 0 and 120.")
        .toInt(),

    // annualLeaveDays
    body("annualLeaveDays")
        .optional()
        .isInt({ min: 0, max: 365 }).withMessage("annualLeaveDays must be between 0 and 365.")
        .toInt(),

    // sickLeaveDays
    body("sickLeaveDays")
        .optional()
        .isInt({ min: 0, max: 365 }).withMessage("sickLeaveDays must be between 0 and 365.")
        .toInt(),

    // workingDaysPerMonth
    body("workingDaysPerMonth")
        .optional()
        .isInt({ min: 1, max: 31 }).withMessage("workingDaysPerMonth must be between 1 and 31.")
        .toInt(),

    // companyEmail
    body("companyEmail")
        .optional({ checkFalsy: true })
        .isEmail().withMessage("companyEmail must be a valid email address.")
        .normalizeEmail(),

    // companyPhone
    body("companyPhone")
        .optional()
        .isString().withMessage("companyPhone must be a string.")
        .trim()
        .isLength({ max: 30 }).withMessage("companyPhone must be 30 characters or fewer."),

    // companyAddress
    body("companyAddress")
        .optional()
        .isString().withMessage("companyAddress must be a string.")
        .trim()
        .isLength({ max: 300 }).withMessage("companyAddress must be 300 characters or fewer."),
];

// exporting
module.exports = settingsValidators;