// use strict mode
"use strict"

const { encode } = require("html-entities");

const xssClean = (req, res, next) => {
  const sanitizeText = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Encodes harmful script tags (e.g., <script> becomes &lt;script&gt;)
          obj[key] = encode(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeText(obj[key]); // Recursively looks inside nested objects/arrays
        }
      }
    }
  };

  if (req.body) {
    sanitizeText(req.body);
  }

  if (req.params) {
    sanitizeText(req.params);
  }

  if (req.query) {
    sanitizeText(req.query);
  }

  next();
};

// exporting
module.exports = xssClean;