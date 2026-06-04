// use use strict mode
"use strict"

// requires
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// path of the folder of logs files
const logDir = path.join(__dirname, "../../logs");

// check if the folder not exist create it
if(!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true }); // to make all folders in the path
}

// get
const today = new Date();

// the form will be "DD_MM_YYYY"
const fileName = `${String(today.getDate()).padStart(2, "0")}_${String(today.getMonth() + 1).padStart(2, "0")}_${today.getFullYear()}.log`;

// create write stream
const accessLogStream = fs.createWriteStream(
    path.join(logDir, fileName),
    { flags: "a" }, // append
);

// morgan
const morganLoggerMiddleware = morgan(
    "combined",
    { stream: accessLogStream, },
);

// exporting
module.exports = morganLoggerMiddleware;