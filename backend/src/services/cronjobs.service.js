// use strict mode
"use strict"

// requires
// libraries
const cron = require("node-cron");

// models
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");
const User = require("../models/User.model");

// services
const notificationService = require("./notification.service");

// functions
// absence detector
const runAbsenceDetector = async () => {
    try {
        console.log("⏰ [CRON] Absence detector running...");

        // get the date and time
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // get all active employees
        const activeEmployees = await Employee.find({ employmentStatus: "active", })
                                              .select("_id userId firstName lastName");
        
        // for each active employee check if they have an attendance record today
        let markedAbsent = 0;

        for(const employee of activeEmployees) {
            // check if an attendance record already exists for today
            const existing = await Attendance.findOne({
                employeeId: employee._id,
                date: today,
            });

            // skip if already marked
            if(existing) {
                continue;
            }

            // create the record
            try {
                // make it absent
                await Attendance.create({
                    employeeId: employee._id,
                    date: today,
                    status: "absent",
                    processedByJob: true,
                });

                // incremint
                markedAbsent++;

                // notify the employee
                if(employee.userId) {
                    await notificationService.createNotification(
                        employee.userId,
                        "absent_alert",
                        `You were marked absent for ${today.toISOString().split("T")[0]}. Contact HR if this is incorrect.`,
                        { data: today },
                    ).catch(() => {}); // silent — notification must not block the job
                }
            } catch (error) {
                if(error.code !== 11000) {
                    console.error(`[CRON] Error marking absent for employee ${employee._id}:`, err.message);
                } else {
                    // throw error
                    throw error;
                }
            }
        }

        // notify all HR Admins with a summary
        if(markedAbsent > 0) {
            try {
                // get all hrs and super admins
                const hrAdmins = await User.find({
                    role: { $in: ["hr_admin", "super_admin"] },
                    accountStatus: "active",
                }).select("_id");

                // get date
                const date = today.toISOString().split("T")[0];

                // make the notification
                for(const admin of hrAdmins) {
                    await notificationService.createNotification(
                        admin._id,
                        "absent_alert",
                        `${markedAbsent} employee(s) were automatically marked absent for ${date}.`,
                        {
                            date: date,
                            markedAbsent: markedAbsent,
                        },
                    ).catch(() => {}); // silent — notification must not block the job
                }
            } catch (error) {
                // do nothing
            }
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