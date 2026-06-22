// use strict mode
"use strict"

// requires
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

// jwt
// sign token
const signAccessToken = (userId, role) => {
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
const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        jwtConfig.access.secret,
        {
            algorithms: [jwtConfig.algorithm],
        },
    );
};

const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        jwtConfig.refresh.secret,
        {
            algorithms: [jwtConfig.algorithm],
        },
    );
};

// exporting
module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };