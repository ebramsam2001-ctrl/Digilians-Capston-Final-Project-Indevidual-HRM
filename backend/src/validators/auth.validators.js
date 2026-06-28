// use strict mode
"use strict"

// requires
// libraries
const { body } = require("express-validator");

// functions
// login validators
const loginValidators = [
    // email
    body("email")
        .notEmpty().withMessage(`email is required.`)
        .isEmail().withMessage(`email must be a valid email address.`)
        .normalizeEmail(),

    // password
    body("password")
        .notEmpty().withMessage(`password is required.`)
        .isLength({ min: 1 }).withMessage(`password cannot be empty.`),
];

// forgot password validators
const forgotPasswordValidators = [
    // email
    body("email")
        .notEmpty().withMessage(`email is required.`)
        .isEmail().withMessage(`email must be a valid email address.`)
        .normalizeEmail(),
];

// reset password validators
const resetPasswordValidators = [
    // token
    body("token")
        .notEmpty().withMessage("token is required."),

    // password
    body("password")
        .notEmpty().withMessage("password is required.")
        .isLength({ min: 8 }).withMessage("password must be at least 8 characters.")
        .matches(/[A-Z]/).withMessage("password must contain at least one uppercase letter.")
        .matches(/[0-9]/).withMessage("password must contain at least one number.")
        .matches(/[^A-Za-z0-9]/).withMessage("password must contain at least one special character."),
];

// change password validators
const changePasswordValidators = [
    // currentPassword
    body("currentPassword")
        .notEmpty().withMessage("currentPassword is required."),

    // new password
    body("newPassword")
        .notEmpty().withMessage("newPassword is required.")
        .isLength({ min: 8 }).withMessage("newPassword must be at least 8 characters.")
        .matches(/[A-Z]/).withMessage("newPassword must contain at least one uppercase letter.")
        .matches(/[0-9]/).withMessage("newPassword must contain at least one number.")
        .matches(/[^A-Za-z0-9]/).withMessage("newPassword must contain at least one special character.")
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                // throw error
                throw new Error("newPassword must be different from currentPassword.");
            }
            return true;
        }),
];

// exporting
module.exports = {
    loginValidators,
    forgotPasswordValidators,
    resetPasswordValidators,
    changePasswordValidators,
};