// use use strict mode
"use strict"

// requires
// Libraries
const crypto = require("crypto");
const mongoose = require("mongoose");

// models
const User = require("../models/User.model");
const Employee = require("../models/Employee.model");
const RefreshToken = require("../models/Refreshtoken.model");

// services
const emailService = require("./email.service");

// utils
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/tokenUtils");
const { AppError } = require("../utils/helpers");

// functions
// hashing token => "sha256" (not reversable)
const hashToken = (rawToken) => {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
};

// convert expire date to future date
const parseExpiryToDate = (str) => {
    const unit = str.slice(-1); // last char
    const val = parseInt(str, 10); // numeric part
    
    // transform the time to (ms)
    const ms = unit === "d" ? (val * 24 * 60 * 60 * 1000) // day
             : unit === "h" ? (val * 60 * 60 * 1000) // hour
             : (val * 60 * 1000); // minuts
    
    return new Data(Date.now() + ms); 
};

// login service
const login = async (email, password, ipAddress, userAgent) => {
    // get the user data by email
    const user = await User.findOne({ email: email })
                           .select(`+passwordHashed +loginAttempts +lockUntil`);

    // check if email exist
    if(!user) {
        // throw error
        throw new AppError(`Invalid email or password.`, 401);
    }

    // check if the account is currently locked
    if(user.lockUntil && user.lockUntil > Date.now()) {
        // git minuts to left
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));

        // throw error
        throw new AppError(`Account locked. Try again in ${minutesLeft} minute(s).`, 423);
    }

    // verify the password with hashed password
    const isPasswordMatch = await user.comparePassword(password);

    // if password not matching
    if(!isPasswordMatch) {
        // increment failed attempts counter
        user.loginAttempts = (user.loginAttempts || 0) + 1;

        // lock the account after 5 failed
        // check if login attempts >= 5
        if(user.loginAttempts >= 5) {
            // get the future date (after 30m)
            user.lockUntil = new Date(Date.now() + (30 * 60 * 1000)); // 30m

            // reset loginAttempts
            user.loginAttempts = 0;
        }

        // save to Database
        await user.save({ validateBeforeSave: false }); // because 1 field only is updated

        // throw error
        throw new AppError(`Invalid email or password.`, 401);
    }

    // one account can't be open over 2 devices
    // check if the account is active
    if(user.accountStatus != "active") {
        // throw error
        throw new AppError(`Account is ${user.accountStatus}.`, 403);
    }

    // successful login
    // reset
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date(); // now

    // save
    await user.save({ validateBeforeSave: false }); // only some fields are updated

    // tokens
    const accessToken = signAccessToken(user._id, user.role);
    const rawRefresh = signRefreshToken(user._id);

    // store refresh token in Database
    await RefreshToken.create({
        userId: user._id,
        tokenHash: hashToken(rawRefresh),
        ipAddress: ipAddress,
        userAgent: userAgent,
        expiresAt: parseExpiryToDate(process.env.JWT_REFRESH_EXPIRES || "7d"),
    });

    // return
    return {
        accessToken: accessToken,
        refreshToken: rawRefresh,
        user: user,
    };
};

// logout
const logout = async (rawRefreshToken) => {
    // check if already logged out
    if(!rawRefreshToken) {
        return ;
    }

    // row hash for comparing with hash password in database
    const hash = hashToken(rawRefreshToken);

    // delete the refresh token from database
    await RefreshToken.deleteOne({ tokenHash: hash });
};

// refresh access token
const refreshAccessToken = async (rawRefreshToken, ipAddress, userAgent) => {
    // check if rawRefreshToken isn't defined
    if(!rawRefreshToken) {
        throw new AppError(`No refresh token provided.`, 401);
    }

    // verify the jwt
    let decoded;
    try {
        decoded = verifyRefreshToken(rawRefreshToken);
    } catch (error) {
        // throw error
        throw new AppError(`Invalid token.`, 401);
    }

    // check if the token exist and (not alredy used, logged out)
    // row hash for comparing with hash password in database
    const hash = hashToken(rawRefreshToken);
    
    // get the token from database
    const stored = await RefreshToken.findOne({ tokenHash: hash });

    // check if (hashed token not exist, already used, or logged out)
    // reuse detection
    if(!stored) {
        // delete all refreshtokens in database and eject the user and the attacker
        await RefreshToken.deleteMany({ userId: decoded.userId });

        // throw error
        throw new AppError(`Refresh token reuse detected. All sessions revoked.`, 401);
    }

    // get the user by ID if exist
    const user = await User.findById(decoded.userId);

    // check if user not exist or is not active
    if(!user || user.accountStatus !== "active") {
        // throw error
        throw new AppError(`User not found`, 401);
    }

    // delete the old token and creater a new one
    // delete the old refresh token
    await stored.deleteOne();

    // create a new one
    const newAccessToken = signAccessToken(user._id, user.role);
    const newRawRefresh  = signRefreshToken(user._id);

    // save it to database
    await RefreshToken.create({
        userId: user._id,
        tokenHash: hashToken(newRawRefresh),
        ipAddress: ipAddress,
        userAgent: userAgent,
        expiresAt: parseExpiryToDate(process.env.JWT_REFRESH_EXPIRES),
    });

    // return
    return {
        accessToken: newAccessToken,
        refreshToken: newRawRefresh,
    };
};

// forget password
const forgotPassword = async (email) => {
    // get user by email
    const user = await User.findOne({ email: email });

    // check if email not exist
    if(!user) {
        return ;
    }

    // token for send to user
    const rawToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false }); // because 1 field only updated

    // send reset email password (add token to URL)
    await emailService.sendPasswordReset(email, rawToken);
};

// validate token that sent to user and set new password
// reset password
const resetPassword = async (rawToken, newPassword) => {
    // hash the token that sent by email
    const hashToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // get user by password reset token and not expired yet
    const user = await User.findOne({
        passwordResetToken: hashToken,
        passwordResetExpires: { $gt: Date.now() }, // not expired yet
    });

    // check if token is not correct or expired
    if(!user) {
        // throw error
        throw new AppError(`Token is invalid.`, 400);
    }

    // set the new password
    user.passwordHashed = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // save the changes
    await user.save();

    // close all session for this user
    // delete all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id });
};


// get the current logged in user's profile
const getMe = async (userId) => {
    // get user by ID
    const user = await User.findById(userId);

    // check if user is not exist
    if(!user) {
        // throw error
        throw new AppError(`User not found.`, 404);
    }

    // return
    return user;
};

// exporting
module.exports = {
    login,
    logout,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    getMe,
};