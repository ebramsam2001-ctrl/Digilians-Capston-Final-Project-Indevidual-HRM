// use strict mode
"use strict";

// Load env before anything else
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

// Models
const User = require("../models/User.model");
const Employee = require("../models/Employee.model");
const Settings = require("../models/Settings.model");
const Notification = require("../models/Notification.model");
const Attendance = require("../models/Attendance.model");
const LeaveRequest = require("../models/LeaveRequest.model");
const Payroll = require("../models/Payroll.model");
const AuditLog = require("../models/AuditLog.model");
const Document = require("../models/Document.model");
const Message = require("../models/Message.model");

// Seed data
const SUPER_ADMIN = {
    email: process.env.SUPER_ADMIN_EMAIL,
    passwordHashed: process.env.SUPER_ADMIN_PASSWORD,
    role: process.env.SUPER_ADMIN_ROLE,
};

const HR_ADMIN = {
    email: process.env.HR_ADMIN_EMAIL,
    passwordHashed: process.env.HR_ADMIN_PASSWORD,
    role: process.env.HR_ADMIN_ROLE,
};

const EMPLOYEES_SEED = [
    {
        user: {
            email: "alice.johnson@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "Alice",
            lastName: "Johnson",
            department: "Engineering",
            jobTitle: "Backend Engineer",
            basicSalary: 15000,
            phone: "+201001234001",
        },
    },
    {
        user: {
            email: "bob.smith@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "Bob",
            lastName: "Smith",
            department: "Engineering",
            jobTitle: "Frontend Engineer",
            basicSalary: 13500,
            phone: "+201001234002",
        },
    },
    {
        user: {
            email: "carol.white@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "Carol",
            lastName: "White",
            department: "Finance",
            jobTitle:
                "Financial Analyst",
            basicSalary: 14000,
            phone: "+201001234003",
        },
    },
    {
        user: {
            email: "david.brown@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "David",
            lastName: "Brown",
            department: "Sales",
            jobTitle: "Sales Manager",
            basicSalary: 16000,
            phone: "+201001234004",
        },
    },
    {
        user: {
            email: "emma.davis@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "Emma",
            lastName: "Davis",
            department: "Marketing",
            jobTitle: "Marketing Specialist",
            basicSalary: 12000,
            phone: "+201001234005",
        },
    },
    {
        user: {
            email: "frank.miller@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "Frank",
            lastName: "Miller",
            department: "HR",
            jobTitle: "HR Coordinator",
            basicSalary: 11500,
            phone: "+201001234006",
        },
    },
    {
        user: {
            email: "grace.wilson@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee",
        },
        emp: {
            firstName: "Grace",
            lastName: "Wilson",
            department: "Design",
            jobTitle: "UI/UX Designer",
            basicSalary: 13000,
            phone: "+201001234007",
        },
    },
    {
        user: {
            email: "henry.moore@hrmepro.com",
            passwordHashed: "Emp@1234",
            role: "employee"
        },
        emp: {
            firstName: "Henry",
            lastName: "Moore",
            department: "IT",
            jobTitle: "System Administrator",
            basicSalary: 14500,
            phone: "+201001234008",
        },
    },
];

// Runner
const seed = async () => {
    await connectDB();
    console.log("🌱 Starting database seed...\n");

    // ── Wipe existing data ────────────────────────────────────────────────────
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
        User.deleteMany({}),
        Employee.deleteMany({}),
        Settings.deleteMany({}),
        Notification.deleteMany({}),
        Attendance.deleteMany({}),
        LeaveRequest.deleteMany({}),
        Payroll.deleteMany({}),
        AuditLog.deleteMany({}),
        Document.deleteMany({}),
        Message.deleteMany({}),
    ]);
    console.log("✅ Existing data cleared.\n");

    // ── Settings ──────────────────────────────────────────────────────────────
    console.log("⚙️  Creating settings...");
    await Settings.create({
        companyName: "HRM Pro Inc.",
        standardStartTime: "09:00",
        standardHoursPerDay: 8,
        graceMinutes: 15,
        annualLeaveDays: 21,
        sickLeaveDays: 14,
        workingDaysPerMonth: 22,
        companyEmail: "hr@hrmepro.com",
        companyPhone: "+20100000000",
        companyAddress: "123 Business District, Cairo, Egypt",
    });
    console.log("✅ Settings created.\n");

    // ── Super Admin ───────────────────────────────────────────────────────────
    console.log("👑 Creating Super Admin...");
    const superAdminUser = await User.create(SUPER_ADMIN);
    await Employee.create({
        userId: superAdminUser._id,
        employeeCode: "EMP-00001",
        firstName: "Super",
        lastName: "Admin",
        department: "IT",
        jobTitle: "System Administrator",
        basicSalary: 0,
        joinDate: new Date(),
    });
    console.log(`✅ Super Admin created: ${SUPER_ADMIN.email}\n`);

    // ── HR Admin ──────────────────────────────────────────────────────────────
    console.log("🧑‍💼 Creating HR Admin...");
    const hrAdminUser = await User.create(HR_ADMIN);
    await Employee.create({
        userId: hrAdminUser._id,
        employeeCode: "EMP-00002",
        firstName: "HR",
        lastName: "Admin",
        department: "HR",
        jobTitle: "HR Manager",
        basicSalary: 20000,
        joinDate: new Date(),
    });
    console.log(`✅ HR Admin created: ${HR_ADMIN.email}\n`);

    // ── Employees ─────────────────────────────────────────────────────────────
    console.log("👥 Creating employees...");
    let codeCounter = 3;

    for (const seed of EMPLOYEES_SEED) {
        const user = await User.create(seed.user);
        await Employee.create({
            userId: user._id,
            employeeCode: `EMP-${String(codeCounter).padStart(5, "0")}`,
            joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            ...seed.emp,
        });
        console.log(`  ✅ ${seed.emp.firstName} ${seed.emp.lastName} (${seed.user.email})`);
        codeCounter++;
    }

    console.log("\n🎉 Database seeded successfully!\n");
    console.log("─────────────────────────────────────────");
    console.log("Account credentials:");
    console.log(`  Super Admin:  ${SUPER_ADMIN.email}  / Admin@1234`);
    console.log(`  HR Admin:     ${HR_ADMIN.email} / Admin@1234`);
    console.log(`  Employees:    *@hrmepro.com         / Emp@1234`);
    console.log("─────────────────────────────────────────\n");

    process.exit(0);
};

seed().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});
