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
        .notEmpty().withMessage(`leaveType is required.`)
        .isIn([`annual`, `sick`, `unpaid`, `other`]).withMessage(`leaveType validation error`),
    
    // startDate
    body("startDate")
        .notEmpty().withMessage(`startDate is required.`)
        .isISO8601().withMessage(`startDate must be a valid date (YYYY-MM-DD).`)
        .toDate(),
    
    // endDate
    body("endDate")
        .notEmpty().withMessage(`endDate is required.`)
        .isISO8601().withMessage(`endDate must be a valid date (YYYY-MM-DD).`)
        .toDate()
        .custom((endDate, { req }) => {
            // endDate must not be before startDate
            const start = new Date(req.body.startDate);

            if (endDate < start) {
                // throw error
                throw new Error("endDate must be on or after startDate.");
            }

            // return
            return true;
        }),
    
    // reason
    body("reason")
    .optional()
    .isString().withMessage(`reason must be a string.`)
    .trim()
    .isLength({ max: 500 }).withMessage(`reason must be 500 characters or fewer.`),
];

// exporting
module.exports = submitLeaveValidators;