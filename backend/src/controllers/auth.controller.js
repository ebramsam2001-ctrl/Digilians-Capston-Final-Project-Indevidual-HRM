// use strict mode
"use strict"

// requires
// services
const authService = require("../services/auth.service");

// utils
const { asyncHandler, sendSuccess } = require("../utils/helpers");

// Helpers
// refresh cookie options
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,   // JS cannot access it
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// functions
// Helpers
// clear refresh cookie
const clearRefreshCookie = (res) => {
    // return
    return res.clearCookie(
        "refreshToken",
        {
            httpOnly: true,
            sameSite: "strict",
        }
    );
};

// controllers
// login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"] || null;

    const { accessToken, refreshToken, user } = await authService.login(email, password, ipAddress, userAgent);

    // Refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    // return
    return sendSuccess(
        res,
        {
            accessToken: accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.accountStatus,
            },
        },
        "Login successful.",
    );
});

// logout
const logout = asyncHandler(async (req, res) => {
    const rawRefresh = req.cookies?.refreshToken;

    // use auth logout service
    await authService.logout(rawRefresh, req.userId, req.ip, req.headers["user-agent"]);

    // use helper function
    clearRefreshCookie(res);

    // return
    return sendSuccess(res, null, "Logged out successfully.");
});

// refresh
const refresh = asyncHandler(async (req, res) => {
    const rawRefresh = req.cookies?.refreshToken;
    const ipAddress  = req.ip;
    const userAgent  = req.headers["user-agent"] || null;

    // use auth refresh access token service
    const { accessToken, refreshToken } = await authService.refreshAccessToken(rawRefresh, ipAddress, userAgent);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    
    // return
    return sendSuccess(res, { accessToken }, "Token refreshed.");
});

// forgot password
const forgotPassword = asyncHandler(async (req, res) => {
    // use auth forgot password
    await authService.forgotPassword(req.body.email);

    // return
    // Always return success — prevents email enumeration
    return sendSuccess(res, null, "If that email is registered, a reset link has been sent.");
});

// reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // use auth reset password
    await authService.resetPassword(token, password, req.ip, req.headers["user-agent"]);

    // return
    return sendSuccess(res, null, "Password reset successfully. Please log in.");
});

// change password
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // use auth change password service
    await authService.changePassword(req.userId, currentPassword, newPassword, req.ip, req.headers["user-agent"]);

    // use helper function
    clearRefreshCookie(res);

    // return
    return sendSuccess(res, null, "Password changed. Please log in again.");
});

// get me
const getMe = asyncHandler(async (req, res) => {
    // use auth get me service
    const user = await authService.getMe(req.userId);

    // return
    return sendSuccess(res, { user }, "Profile fetched.");
});

// exporting
module.exports = {
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe,
};