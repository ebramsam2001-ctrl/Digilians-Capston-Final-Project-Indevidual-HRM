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
    clockIn,
    clockOut,
    listAttendance,
    getOverview,
    getMonthlyData,
} = require("../controllers/attendance.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

// Employee actions
router.post("/clock-in", clockIn);
router.post("/clock-out", clockOut);

// HR Admin only — daily overview
router.get("/overview", roleGuard("hr_admin", "super_admin"), getOverview);

// All authenticated — employees see own, HR sees all
router.get("/", listAttendance);
router.get("/monthly", getMonthlyData);

// exporting
module.exports = router;