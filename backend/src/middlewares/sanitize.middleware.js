// use strict mode
"use strict"

const sanitization = (req, res, next) => {
  const clean = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key]; // Deletes malicious operators like $gt, $ne
        } else if (typeof obj[key] === 'object') {
          clean(obj[key]); // Recursively cleans nested objects/arrays
        }
      }
    }
  };

  if (req.body) {
    clean(req.body);
  }

  if (req.params) {
    clean(req.params);
  }

  if (req.query) {
    clean(req.query);
  }

  next();
};

// exporting
module.exports = sanitization;