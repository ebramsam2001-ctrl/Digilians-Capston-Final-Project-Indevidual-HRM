// function
const errorHandler = (err, req, res, next) => {
    // error details
    let status = err.statusCode || 500;
    let message = err.message || `Server error`;
    let errors = undefined;

    // mongoose duplicate key
    if(err.code === 11000) {
        status = 409;
        message = `${Object.keys(err.keyValue)[0]} already exists`;
    }

    // mongoose validation
    if(err.name === "ValidationError") {
        status = 422;
        message = "Validation failed";

        // map errors to array of {field, message}
        errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: err.message,
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
module.exports = errorHandler;