// use use strict mode
"use strict"

// requires
const { AppError } = require("../utils/helpers");

// role guard middleware
const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        // check if role are defined
        if(!req.role) {
            return next(
                new AppError(`authMiddleware must be applied before roleGuard.`, 500)
            );
        }

        // check if not authorize
        if(!allowedRoles.includes(req.role)) {
            return next(
                new AppError(`Not Authorize.`, 403)
            );
        }

        next();
    };
};

// exporting
module.exports = roleGuard;