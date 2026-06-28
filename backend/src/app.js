// use strict mode
"use strict";

// requires
// libraries
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

// Security middlewares
const sanitize = require("./middlewares/sanitize.middleware");
const xssClean = require("./middlewares/xssClean.middleware");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");
const loggerMiddleware = require("./middlewares/logger.middleware");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

// Routes
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const leaveRoutes = require("./routes/leave.routes");
const payrollRoutes = require("./routes/payroll.routes");
const notificationRoutes = require("./routes/notification.routes");
const reportRoutes = require("./routes/report.routes");
const settingsRoutes = require("./routes/settings.routes");
const chatRoutes = require("./routes/chat.routes");
const documentRoutes = require("./routes/document.routes");
const healthRoutes = require("./routes/health.routes");

// App
const app = express();

// Security headers
// Helmet sets 11 HTTP security headers in one call
app.use(helmet());

// CORS
// Only allow the configured frontend origin — everything else is rejected
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Required for HttpOnly cookie exchange
}));

// NoSQL injection prevention
// Strips $-prefixed keys from req.body, req.query, req.params
app.use(sanitize);

// XSS defence
// HTML-encodes dangerous characters in string inputs
app.use(xssClean);

// HTTP Parameter Pollution
// Keeps the last value when a query param appears multiple times
app.use(hpp());

// Body parsing 
// Hard 10 kb limit — prevents oversized payload DoS attacks
app.use(express.json({ limit: "10kb" }));

// Cookie parsing
app.use(cookieParser());

// Request logging
app.use(loggerMiddleware);

// API-wide rate limiter
// 100 requests / 15 minutes per IP — tighter limits on auth routes (see auth.routes.js)
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/health", healthRoutes);

// Error handling
app.use(notFound);     // 404 for unmatched routes
app.use(errorHandler); // Global error handler

// exporting
module.exports = app;