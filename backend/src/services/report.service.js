// use strict mode
"use strict"

// requires
// libraries
// const mongoose = require("mongoose");

// models
const Employee = require("../models/Employee.model");
const Attendance = require("../models/Attendance.model");
const LeaveRequest = require("../models/LeaveRequest.model");
const Payroll = require("../models/Payroll.model");

// functions
// executive HR analytics dashboard
const getSummary = async () => {
    // run more than one aggregations in parallel
    const [result] = await Employee.aggregate([
        {
            $facet: {
                // total active headcount
                headcount: [
                    { $match: { employmentStatus: "active" } },
                    { $count: "count" },
                ],

                // headcount by department
                byDepartment: [
                    { $match: { employmentStatus: "active" } },
                    {
                        $group: {
                            _id: "$department",
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { count: -1 } }, // descending
                ],

                // headcount by status
                byStatus: [
                    {
                        $group: {
                            _id: "$employmentStatus",
                            count: { $sum: 1 },
                        },
                    },
                ],

                // new hires last 30 days
                recentHires: [
                    {
                        $match: {
                            joinDate: {
                                $gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days
                            },
                        },
                    },
                    { $count: "count" },
                ],
            },
        },
    ]);

    // total leave requests
    const pendingLeaves = await LeaveRequest.countDocuments({ status: "pending" });

    // return
    return {
        headcount: result.headcount[0]?.count || 0,
        recentHires: result.recentHires[0]?.count || 0,
        pendingLeaves: pendingLeaves,
        byDepartment: result.byDepartment,
        byStatus: result.byStatus,
    };
};

// get attendance report
const getAttendanceReport = async (startDate, endDate) => {
    // get the date (start, end)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // status breakdown across the range
    const [statusBreakdown] = await Attendance.aggregate([
        {
            $match: {
                date: {
                    $gte: start,
                    $lte: end,
                },
            },
        },
        {
            $facet: {
                // overall counts per status
                overall: [
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                        },
                    },
                ],

                // daily trend (for line chart)
                daily: [
                    {
                        $group: {
                            _id: {
                                date: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$date",
                                    },
                                },
                                status: "$status",
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { "_id.date": 1 } },
                ],

                // average late minutes among late records
                lateStats: [
                    { $match: { status: "late" } },
                    {
                        $group: {
                            _id: null,
                            avgLateMinutes: { $avg: "$lateMinutes" },
                            totalLateMinutes: { $sum: "$lateMinutes" },
                        }
                    },
                ],
            },
        },
    ]);

    // return
    return {
        dateRange: {
            startDate: startDate,
            endDate: endDate,
        },
        overall: statusBreakdown.overall,
        daily: statusBreakdown.daily,
        lateStats: statusBreakdown.avgLate[0] || { avgLateMinutes: 0, totalLateMinutes: 0 },
    };
};

// getLeaveReport
const getLeaveReport = async (month) => {
    // build date range
    const now = new Date();
    const yyyyMM = month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const [year, m] = yyyyMM.split("-").map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

    // get the data
    const [result] = await LeaveRequest.aggregate([
        {
            $match: {
                startDate: { $lte: end },
                endDate: { $gte: start },
            },
        },
        {
            $facet: {
                // count by status
                byStatus: [
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                        },
                    },
                ],

                // count by leave type (approved only)
                byType: [
                    { $match: { status: "approved" } },
                    {
                        $group: {
                            _id: "$leaveType",
                            count: { $sum: 1 },
                            totalDays: { $sum: "$durationDays" },
                        },
                    },
                    { $sort: { totalDays: -1 } },
                ],

                // top 5 leave takers (most days approve
                topTakers: [
                    { $match: { status: "approved" } },
                    {
                        $group: {
                            _id: "$employeeId",
                            totalDays: { $sum: "$durationDays" },
                        },
                    },
                    { $sort: { totalDays: -1 } },
                    { $limit: 5 },
                    {
                        $lookup: { // return Array
                            from: "employees",
                            localField: "_id",
                            foreignField: "_id",
                            as: "employee",
                        },
                    },
                    { $unwind: "$employee" }, // return object
                    {
                        $project: {
                            totalDays: 1,
                            name: {
                                $concat: ["$employee.firstName", " ", "$employee.lastName"],
                            },
                            department: "$employee.department",
                            employeeCode: "$employee.employeeCode",
                        },
                    },
                ],
            },
        },
    ]);

    // return
    return {
        month: yyyyMM,
        byStatus: result.byStatus,
        byType: result.byType,
        topTakers: result.topTakers,
    };
};

// get payroll report
const getPayrollReport = async (month) => {
    const now = new Date();
    const yyyyMM = month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const [result] = await Payroll.aggregate([
        { $match: { month: yyyyMM } },
        {
            $facet: {
                totals: [
                    {
                        $group: {
                            _id: null,
                            employeeCount: { $sum: 1 },
                            totalBasicSalary: { $sum: "$basicSalary" },
                            totalLateDeductions: { $sum: "$lateDeduction" },
                            totalAbsenceDeductions: { $sum: "$absenceDeduction" },
                            totalBonuses: { $sum: "$bonus" },
                            totalNetSalary: { $sum: "$netSalary" },
                        }
                    },
                ],
                byStatus: [
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                        }
                    }
                ],
            },
        },
    ]);

    // return
    return {
        month: yyyyMM,
        totals: result.totals[0] || { employeeCount: 0, totalBasicSalary: 0, totalNetSalary: 0 },
        byStatus: result.byStatus,
    };
};

// export the data
const getExportData = async ({ type, month, startDate, endDate }) => {
    const now = new Date();
    const yyyyMM = month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    // if type = "attendance"
    if (type === "attendance") {
        const [year, m] = yyyyMM.split("-").map(Number);
        const start = startDate ? new Date(startDate) : new Date(Date.UTC(year, m - 1, 1));
        const end = endDate ? new Date(endDate) : new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

        const records = await Attendance.find({ date: { $gte: start, $lte: end } })
            .populate("employeeId", "firstName lastName employeeCode department")
            .sort({ date: 1 })
            .lean();

        return records.map(record => ({
            date: record.date?.toISOString().split("T")[0],
            employeeCode: record.employeeId?.employeeCode,
            employeeName: `${record.employeeId?.firstName} ${record.employeeId?.lastName}`,
            department: record.employeeId?.department,
            status: record.status,
            checkIn: record.checkIn?.toISOString() || null,
            checkOut: record.checkOut?.toISOString() || null,
            workedMinutes: record.workedMinutes,
            lateMinutes: record.lateMinutes,
        }));
    }

    // if type = "leave"
    if (type === "leave") {
        const [year, m] = yyyyMM.split("-").map(Number);
        const start = new Date(Date.UTC(year, m - 1, 1));
        const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

        const requests = await LeaveRequest.find({ startDate: { $lte: end }, endDate: { $gte: start } })
            .populate("employeeId", "firstName lastName employeeCode department")
            .populate("reviewedBy", "email")
            .lean();

        return requests.map(record => ({
            employeeCode: record.employeeId?.employeeCode,
            employeeName: `${record.employeeId?.firstName} ${record.employeeId?.lastName}`,
            department: record.employeeId?.department,
            leaveType: record.leaveType,
            startDate: record.startDate?.toISOString().split("T")[0],
            endDate: record.endDate?.toISOString().split("T")[0],
            durationDays: record.durationDays,
            status: record.status,
            reason: record.reason || "",
            reviewedBy: record.reviewedBy?.email || "",
        }));
    }

    // if type = "payroll"
    if (type === "payroll") {
        const payrolls = await Payroll.find({ month: yyyyMM })
            .populate("employeeId", "firstName lastName employeeCode department jobTitle")
            .lean();

        return payrolls.map(payroll => ({
            employeeCode: payroll.employeeId?.employeeCode,
            employeeName: `${payroll.employeeId?.firstName} ${payroll.employeeId?.lastName}`,
            department: payroll.employeeId?.department,
            jobTitle: payroll.employeeId?.jobTitle,
            month: payroll.month,
            basicSalary: payroll.basicSalary,
            lateDeduction: payroll.lateDeduction,
            absenceDeduction: payroll.absenceDeduction,
            bonus: payroll.bonus,
            netSalary: payroll.netSalary,
            status: payroll.status,
            presentDays: payroll.breakdown?.presentDays || 0,
            absentDays: payroll.breakdown?.absentDays || 0,
            lateDays: payroll.breakdown?.lateDays || 0,
        }));
    }

    // return
    return []; // unknown type
};

// exporting
module.exports = {
    getSummary,
    getAttendanceReport,
    getLeaveReport,
    getPayrollReport,
    getExportData,
};