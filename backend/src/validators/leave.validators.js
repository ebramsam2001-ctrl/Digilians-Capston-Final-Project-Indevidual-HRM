// use strict mode
"use strict"

// requires
// libraries
const { body } = require("express-validator");

// functions
// submit leave validators
const submitLeaveValidators = [
    // leaveType
    body("leaveType")
        .notEmpty().withMessage("leaveType is required.")
        .isIn(["annual", "sick", "unpaid", "other"])
        .withMessage("leaveType must be annual, sick, unpaid, or other."),

    // startDate
    body("startDate")
        .notEmpty().withMessage("startDate is required.")
        .isISO8601().withMessage("startDate must be a valid date (YYYY-MM-DD).")
        .toDate(),

    // endDate
    body("endDate")
        .notEmpty().withMessage("endDate is required.")
        .isISO8601().withMessage("endDate must be a valid date (YYYY-MM-DD).")
        .toDate()
        .custom((endDate, { req }) => {
            if (new Date(endDate) < new Date(req.body.startDate)) {
                // throw error
                throw new Error("endDate must be on or after startDate.");
            }

            // return
            return true;
        }),
    
    // reason
    body("reason")
        .optional()
        .isString().withMessage("reason must be a string.")
        .trim()
        .isLength({ max: 500 }).withMessage("reason must be 500 characters or fewer."),
];

// reject leave validators
const rejectLeaveValidators = [
    // reviewNote
    body("reviewNote")
        .optional()
        .isString().withMessage("reviewNote must be a string.")
        .trim()
        .isLength({ max: 500 }).withMessage("reviewNote must be 500 characters or fewer."),
];

// exporting
module.exports = { submitLeaveValidators, rejectLeaveValidators };