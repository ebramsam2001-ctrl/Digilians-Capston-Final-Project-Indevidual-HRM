// use use strict mode
"use strict"

// requires
// Libraries
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");


// middlewares
// security middleware
const sanitize = require("./middlewares/sanitize.middleware");
const xssClean = require("./middlewares/xssClean.middleware");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");

// morgan logger middleware
const loggerMiddleware = require("./middlewares/logger.middleware");

// global error handler middle ware
const { notFound, errorHandler} = require("./middlewares/error.middleware");

// app
const app = express();

// middlewares
// helmet for security
app.use(helmet());

// cors
app.use(cors({
    origin: process.env.CLIENT_URL, // this path only
    credentials: true, // transfare the cookes between front-end and back-end safly
}));

// block NOSQL injection (remove $, . from inputs)
app.use(sanitize);

// xss clean (defence from JS injection)
app.use(xssClean);

// hpp (HTTP Parameter Polution) -> get the last parameter only
app.use(hpp());

// parse to JSON with limit 10kb
app.use(express.json({limit: "10kb"}));

// read the cookies
app.use(cookieParser());

// logger middleware
app.use(loggerMiddleware);

// protect the server from Brute Force attack
app.use("/api", apiLimiter);

// Roures ------------------------------------------------------------
// Test route
app.get("/health", (req, res, next) => {
    return res.status(200).json({message: "☑️ All things is good"});
});


// error handling
// not founded path
app.use(notFound);

// global error handler
app.use(errorHandler);

// exporting
module.exports = app;