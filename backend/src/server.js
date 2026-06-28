// use strict mode
"use strict";

// requires
// env
// Load env FIRST — before any other module reads process.env
require("dotenv").config();

// libraries
const http = require("http");

// modules
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./socket");

// services
const { startCronJobs } = require("./services/cronjobs.service");

// HTTP server
// We need an explicit http.Server instance so Socket.IO can attach to it.
const httpServer = http.createServer(app);

// Startup sequence
const startServer = async () => {
    try {
        // 1. Connect to MongoDB
        await connectDB();

        // 2. Initialize Socket.IO and attach io to app.locals
        //    This makes io accessible inside controllers via req.app.locals.io
        const io = initSocket(httpServer);
        app.locals.io = io;

        // 3. Start nightly cron jobs (absence detector, etc.)
        startCronJobs();

        // 4. Start listening
        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, () => {
            console.log(`\n🚀 HRM Pro server running on port: ${PORT}`);
            console.log(`🌍 Environment:\t\t${process.env.NODE_ENV}`);
            console.log(`🔗 API:\t\t\thttp://localhost:${PORT}/api`);
            console.log(`❤️  Health:\t\thttp://localhost:${PORT}/health`);
            console.log(`🔌 Socket.IO:\t\tattached\n`);
        });
    } catch (error) {
        console.error("❌ Server startup failed:", error.message);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
        console.log("✅ HTTP server closed.");
        process.exit(0);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Catch unhandled promise rejections — log and exit so the process manager restarts
process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Rejection:", reason);
    shutdown("unhandledRejection");
});

// start server
startServer();