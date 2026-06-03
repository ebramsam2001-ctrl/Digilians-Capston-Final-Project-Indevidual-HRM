// require rate limiter
const rateLimit = require("express-rate-limit");

// auth rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15m
    max: 5,
    skipSuccessfulRequests: true, // dont count successful requists

    // message will appear when you faild with your trys
    message: {
        success: false,
        message: "Too many attempts. Try in 15 min.",
    },

    // information send
    standardHeaders: true, // send to front-end the information of get back (Limit, Remaining)
    legacyHeaders: false, // delete the preavious information
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1m
    max: 100,

    // message will appear when you faild with your trys
    message: {
        success: false,
        message: "Too many requests.",
    },
});

// exporting
module.exports = { authLimiter, apiLimiter };