// use strict mode
"use strict"

// safty point for Async controllers and if there are any error go to global error handler
const asyncHandler = (func) => {
    return (req, res, next) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    };
};

// class for get the errors and handel it for bassing to glopal error handler
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Quick reply
const sendSuccess = (res, data, message = "Success", code = 200) => {
    return res.status(code).json({
        success: true,
        message,
        data,
    });
};

const sendError = (res, message, code = 400) => {
    return res.status(code).json({
        success: false,
        message,
    });
};

module.exports = { asyncHandler, AppError, sendSuccess, sendError };