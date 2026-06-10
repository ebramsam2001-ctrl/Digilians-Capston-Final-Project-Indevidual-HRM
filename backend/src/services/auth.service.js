// use use strict mode
"use strict"

//requires
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
const login = async (rawRefreshToken) => {
    // check if already logged out
    if(!rawRefreshToken) {
        return ;
    }

    // hash row for comparing with hash password in database
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
        throw new AppError(`Invalid token.`, 401);
    }

    
};