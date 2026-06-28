// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");

// middlewares
const authMiddleware = require("../middlewares/auth.middleware");
const roleGuard = require("../middlewares/roleguard.middleware");

// controllers
const {
    getSummary,
    getAttendanceReport,
    getLeaveReport,
    getPayrollReport,
    exportReport,
    getAuditLogs,
} = require("../controllers/report.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

// router role guard middleware
router.use(roleGuard("hr_admin", "super_admin"));

router.get("/summary", getSummary);
router.get("/attendance", getAttendanceReport);
router.get("/leave", getLeaveReport);
router.get("/payroll", getPayrollReport);
router.get("/export", exportReport);

// Super Admin only — audit trail
router.get("/audit-logs", roleGuard("super_admin"), getAuditLogs);

// exporting
module.exports = router;