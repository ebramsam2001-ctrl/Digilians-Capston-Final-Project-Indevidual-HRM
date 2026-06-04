// use use strict mode
"use strict"

// require express-validator
const { validationResult } = require("express-validator");

// function validate
const validate = (rules) => {
    return async (req, res, next) => {
        // check for the all rules at the same time
        await Promise.all(rules.map(rule => rule.run(req)));

        // get all errors by rules
        const errors = validationResult(req);

        // if no errors
        if(errors.isEmpty()) {
            return next();
        }

        // get response if errors exist
        return next(errors)
    };
};

// exporting
module.exports = validate;