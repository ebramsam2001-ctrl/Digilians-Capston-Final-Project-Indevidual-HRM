// use strict mode
"use strict"

// requires
// libraries
const { body } = require("express-validator");

// helpers
// departments
const DEPARTMENTS = [
    "Engineering",
    "HR",
    "Finance",
    "Sales",
    "Marketing",
    "Operations",
    "Legal",
    "Design",
    "Product",
    "IT",
    "Other",
];

// functions
// create employee validators
const createEmployeeValidators = [
    // email
    body("email")
        .notEmpty().withMessage("email is required.")
        .isEmail().withMessage("email must be a valid email address.")
        .normalizeEmail(),

    // password
    body("password")
        .notEmpty().withMessage("password is required.")
        .isLength({ min: 8 }).withMessage("password must be at least 8 characters.")
        .matches(/[A-Z]/).withMessage("password must contain at least one uppercase letter.")
        .matches(/[0-9]/).withMessage("password must contain at least one number.")
        .matches(/[^A-Za-z0-9]/).withMessage("password must contain at least one special character."),

    // firstName
    body("firstName")
        .notEmpty().withMessage("firstName is required.")
        .trim()
        .isLength({ max: 50 }).withMessage("firstName must be 50 characters or fewer."),

    // lastName
    body("lastName")
        .notEmpty().withMessage("lastName is required.")
        .trim()
        .isLength({ max: 50 }).withMessage("lastName must be 50 characters or fewer."),

    // phone
    body("phone")
        .optional()
        .isMobilePhone().withMessage("phone must be a valid phone number."),

    // department
    body("department")
        .notEmpty().withMessage("department is required.")
        .isIn(DEPARTMENTS).withMessage(`department must be one of: ${DEPARTMENTS.join(", ")}.`),

    // jobTitle
    body("jobTitle")
        .notEmpty().withMessage("jobTitle is required.")
        .trim()
        .isLength({ max: 100 }).withMessage("jobTitle must be 100 characters or fewer."),

    // basicSalary
    body("basicSalary")
        .notEmpty().withMessage("basicSalary is required.")
        .isFloat({ min: 0 }).withMessage("basicSalary must be a positive number.")
        .toFloat(),

    // joinDate
    body("joinDate")
        .optional()
        .isISO8601().withMessage("joinDate must be a valid date (YYYY-MM-DD).")
        .toDate(),

    // role
    body("role")
        .optional()
        .isIn(["employee", "hr_admin"]).withMessage("role must be employee or hr_admin."),
];

// update employee validators
const updateEmployeeValidators = [
    // firstName
    body("firstName")
        .optional()
        .trim()
        .notEmpty().withMessage("firstName cannot be blank.")
        .isLength({ max: 50 }).withMessage("firstName must be 50 characters or fewer."),

    // lastName
    body("lastName")
        .optional()
        .trim()
        .notEmpty().withMessage("lastName cannot be blank.")
        .isLength({ max: 50 }).withMessage("lastName must be 50 characters or fewer."),

    // phone
    body("phone")
        .optional()
        .isMobilePhone().withMessage("phone must be a valid phone number."),

    // department
    body("department")
        .optional()
        .isIn(DEPARTMENTS).withMessage(`department must be one of: ${DEPARTMENTS.join(", ")}.`),

    // jobTitle
    body("jobTitle")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("jobTitle must be 100 characters or fewer."),

    // basicSalary
    body("basicSalary")
        .optional()
        .isFloat({ min: 0 }).withMessage("basicSalary must be a positive number.")
        .toFloat(),

    // employmentStatus
    body("employmentStatus")
        .optional()
        .isIn(["active", "on_leave", "suspended", "terminated"])
        .withMessage("Invalid employment status."),
];

// exporting
module.exports = { createEmployeeValidators, updateEmployeeValidators };