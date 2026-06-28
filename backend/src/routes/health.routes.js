// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");
const mongoose = require("mongoose");

// make the router
const router = Router();

// the health middleware
router.get("/", (req, res) => {
    const dbState = ["disconnected", "connected", "connecting", "disconnecting"];

    // return
    return res.status(200).json({
        success: true,
        message: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: dbState[mongoose.connection.readyState] || "unknown",
        uptime: `${Math.floor(process.uptime())}s`,
    });
});

// exporting
module.exports = router;