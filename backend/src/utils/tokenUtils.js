// use strict mode
"use strict"

// requires
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

// jwt
// sign token
// sign access token
const signAccessToken = (userId, role) => {
    // return
    return jwt.sign(
        {
            userId: userId,
            role: role,
        },
        jwtConfig.access.secret,
        {
            expiresIn: jwtConfig.access.expiresIn,
            algorithm: jwtConfig.algorithm,
        },
    );
};

// sign refresh token
const signRefreshToken = (userId) => {
    return jwt.sign(
        {
            userId: userId,
        },
        jwtConfig.refresh.secret,
        {
            expiresIn: jwtConfig.refresh.expiresIn,
            algorithm: jwtConfig.algorithm,
        },
    );
};

// verify token
// verify access token
const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        jwtConfig.access.secret,
        {
            algorithms: [jwtConfig.algorithm],
        },
    );
};

// verify refresh token
const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        jwtConfig.refresh.secret,
        { algorithms: [jwtConfig.algorithm] },
    );
};

// exporting
module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};