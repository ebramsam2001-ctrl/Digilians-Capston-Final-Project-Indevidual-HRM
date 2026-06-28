// use strict mode
"use strict"

// requires
// libraries
const cron = require("node-cron");

// models
// const Employee = require("../models/Employee.model");
// const Attendance = require("../models/Attendance.model");
const User = require("../models/User.model");

// services
const notificationService = require("./notification.service");
const attendanceService = require("./attendance.service");
const auditService = require("./audit.service");

// functions
// absence detector
const runAbsenceDetector = async () => {
    try {
        console.log("⏰ [CRON] Absence detector running...");

        // use attendance mark absent service
        const result = await attendanceService.markAbsentees();

        // check if result > 0
        if (result.markedAbsent > 0) {
            // Notify all HR admins and super admins
            const hrUsers = await User.find({
                role: { $in: ["hr_admin", "super_admin"] },
                accountStatus: "active",
            }).select("_id");

            // get today
            const today = new Date().toISOString().split("T")[0];

            // for each HR
            for (const hrUser of hrUsers) {
                try {
                    // use notification create service
                    await notificationService.createNotification(
                        hrUser._id,
                        "absent_alert",
                        `${result.markedAbsent} employee(s) were marked absent for ${today}.`,
                        {
                            date: today,
                            count: result.markedAbsent,
                        },
                    );
                } catch (error) {
                    // Notification failure must never stop the cron job
                }
            }

            // use audit service
            await auditService.log({
                action:   "CRON_ABSENCES_MARKED",
                resource: "Attendance",
                changes:  {
                    markedAbsent: result.markedAbsent,
                    date: today,
                },
            });
        }

        console.log(`✅ [CRON] Absence detector complete — ${markedAbsent} marked absent.`);
    } catch (error) {
        console.error("❌ [CRON] Absence detector error:", error.message);
    }
};

// Start all cron jobs
const startCronJobs = () => {
    cron.schedule(
        "55 23 * * *", // Minuts Hours Days Months weaks
        runAbsenceDetector,
        { timezone: "UTC" },
    );
};

// exporting
module.exports = { startCronJobs, runAbsenceDetector };