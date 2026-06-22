// use strict mode
"use strict"

const { AppError } = require("../utils/helpers");

// not found api
const notFound = (req, res, next) => {
    const error = new AppError(`Not Found - Cannot find ${req.originalUrl} on this server`, 404);
    next(error);
};

// global error handler
const errorHandler = (err, req, res, next) => {
    // error details
    let status = err.statusCode || 500;
    let message = err.message || `Server error`;
    let errors = undefined;

    // mongoose duplicate key
    if(err.code === 11000) {
        status = 409;
        message = `${Object.keys(err.keyValue)[0]} Invalid`;
    }

    // Condition for express-validator errors
    if (err && typeof err.array === "function") {
        status = 422;
        message = "Validation failed";
        errors = err.array().map((e) => ({
            field: e.path,
            message: e.msg,
        }));
    }

    // mongoose validation and express-validator
    if(err.name === "ValidationError") {
        status = 422;
        message = "Validation failed";

        // map errors to array of {field, message}
        errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));
    }

    const response = {
        success: false,
        message,
        ...(errors && { errors }), // add errors only if it's defined
    };

    // trace the error from stack
    if(process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    // return response
    return res.status(status).json(response);
};

// exporting
module.exports = { notFound, errorHandler};