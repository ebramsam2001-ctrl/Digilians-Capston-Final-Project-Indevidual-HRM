// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");

// middlewares
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { authLimiter } = require("../middlewares/rateLimiter.middleware");

// validators
const {
    loginValidators,
    forgotPasswordValidators,
    resetPasswordValidators,
    changePasswordValidators,
} = require("../validators/auth.validators");

// controllers
const {
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe,
} = require("../controllers/auth.controller");

// make the router
const router = Router();

// Public
router.post("/login", authLimiter, validate(loginValidators), login);
router.post("/refresh", refresh);
router.post("/forgot-password", authLimiter, validate(forgotPasswordValidators), forgotPassword);
router.post("/reset-password", validate(resetPasswordValidators), resetPassword);

// Protected
router.post("/logout", authMiddleware, logout);
router.post("/change-password", authMiddleware, validate(changePasswordValidators), changePassword);
router.get("/me", authMiddleware, getMe);

// exporting
module.exports = router;