// use strict mode
"use strict"

// requires
// models
const User = require("../models/User.model");

// utils
const { verifyAccessToken } = require("../utils/tokenUtils");
const { AppError } = require("../utils/helpers");

// auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        // extract the token
        let token;

        // authorization header
        const authHeader = req.headers.authorization;

        // check if token sended and if it Bearer token
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1]; // get the token only
        }

        // check if token not send in authorization header get it from cookies
        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken; // get token from cookies
        }

        // check if no token provided
        if (!token) {
            return next(
                new AppError(`Authentication required. No token provided.`, 401)
            );
        }

        // verify access token
        const { userId, iat, role } = verifyAccessToken(token);

        // get the user data from database
        const user = await User.findById(userId)
            .select(`+passwordChangedAt +loginAttempts +lockUntil`);

        // check if user exist or not
        if (!user) {
            return next(
                new AppError(`User no longer exists.`, 401)
            );
        }

        // check if account status suspended
        if (user.accountStatus === "suspended") {
            return next(
                new AppError(`Account suspended. Contact HR.`, 403)
            );
        }

        // check if account status locked
        if (user.accountStatus === "locked") {
            return next(
                new AppError(`Account locked.`, 403)
            );
        }

        // for more security (if token stolen make it not accessable)
        // check if password changed
        if (user.passwordChangedAt) {
            // get time per sec
            const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);

            // iat -> the time of token
            // if token maked befor changed password logout him
            if (iat < changedAtSec) {
                return next(
                    new AppError(`Password was changed. Please log in again.`, 401)
                );
            }
        }

        // add data to req
        req.userId = userId;
        req.role = role;
        req.user = user;
    } catch (error) {
        // jwt.verify errors
        if (error.name === "TokenExpiredError") {
            return next(
                new AppError(`Token expired. Please refresh.`, 401)
            );
        }
        if (error.name === "JsonWebTokenError") {
            return next(
                new AppError(`Invalid token.`, 401)
            );
        }

        // else throw error
        return next(error);
    }
};

// exporting
module.exports = authMiddleware;