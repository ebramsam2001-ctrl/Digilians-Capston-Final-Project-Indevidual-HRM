// use strict mode
"use strict"

const jwtConfig = {
    // json web token Access key secret and expires
    access: {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
    },
    // json web token Refresh key secret and expires
    refresh: {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
    },
    // Algorithm used
    algorithm: "HS256", // Default algorithm for security
};

// check if access and refresh secret key had get from ".env"
if(!jwtConfig.access.secret || !jwtConfig.refresh.secret) {
    // throw error
    throw new Error(`JWT secrets must be set in .env`);
}

// exporting
module.exports = jwtConfig;