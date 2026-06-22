// use strict mode
"use strict"

// requires
// libraries
const mongoose = require("mongoose");

// models
const Employee = require("../models/Employee.model");
const User = require("../models/User.model");

// services
const emailService = require("./email.service");

// utils
const { AppError } = require("../utils/helpers");

// functions
// generate employee code
const generateEmployeeCode = async() => {
    // get the employee count
    const count = await Employee.countDocuments();

    // make the code
    const code = String(count + 1).padStart(5, "0"); // 5 digits min

    // return
    return `EMP-${code}`;
};

// create employee
const createEmployee = async (data, createdBy) => {
    // Destructuring the data
    const {
        email,
        password,
        role = "employee",
        firstName,
        lastName,
        phone,
        department,
        jobTitle,
        basicSalary,
        joinDate,
        location,
    } = data;

    // make (MongoDB Transactions)
    // to make (All or Nothing) can not make 1 operation without another operation 

    // create session
    const session = await mongoose.startSession();
    session.startTransaction(); // All or nothing

    try {
        // create user
        // make it using a Destructuring because of session use
        const [user] = await User.create([{
            email: email,
            passwordHashed: password, // pre hook will hash it
            role: role,
            createdBy: createdBy,
        }], { session: session });

        // generate a new employee code
        const employeeCode = await generateEmployeeCode();

        // create employee
        // make it using a Destructuring because of session use
        const [employee] = await Employee.create([{
            userId: user._id,
            employeeCode: employeeCode,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            department: department,
            jobTitle: jobTitle,
            basicSalary: basicSalary,
            joinDate: joinDate || new Date(), // or now
            location: location || null,
        }], { session: session });

        // commit both inserts together
        await session.commitTransaction();

        // send welcome email with the temporary password
        try {
            await emailService.sendWelcome(email, `${firstName} ${lastName}`, password);
        } catch (error) {
            // get warning in the console
            console.warn(`[EMAIL] Failed to send welcome email to ${email}`);
        }

        // return
        return { user, employee };
    } catch (error) {
        // return all things happend in this session to before session created
        await session.abortTransaction();

        // throw error
        throw error;
    } finally {
        // end the session
        session.endSession();
    }
};

// pagination and Dynamic Query
// list employees
const listEmployees = async ({ page = 1, limit = 10, search, department, status }) => {
    // make the object to add the options of the searching
    const query = {};

    // check if search is defind
    if(search) {
        // add to (query object) search
        // $ -> for (Full-Text Search Engine) in mongoDB
        query.$text = { $search: search };
    }

    // check if department is defind
    if(department) {
        // add to (query object) search
        query.department = department;
    }

    // check if status is defind
    if(status) {
        // add to (query object) search
        query.department = status;
    }

    // paginatin
    // skip: the number of employee that the database should be skip
    const skip = (parseInt(page) - 1) * (Math.min(parseInt(limit), 100)); // if it not a number

    // take: the number of employee that actually get
    const take = Math.min(parseInt(limit), 100); // if it not a number

    // make more than one query in the same time
    const [employees, total] = await Promise.all([
        // get employees
        Employee.find(query)
                .populate("userId", "email role accountStatus lastLoginAt")
                .sort({ createdAt: -1 }) // Desending
                .skip(skip)
                .limit(take),
        // employee count
        Employee.countDocuments(query),
    ]);

    // return
    return {
        employees: employees,
        pagination: {
            total: total,
            page: parseInt(page), // if it not a number
            limit: take,
            totalPages: Math.ceil(total / take),
        },
    };
};

// get employee by ID
const getEmployeeById = async (id) => {
    // get the employee by ID
    const employee = await Employee.findById(id)
                                   .populate("userId", "email role accountStatus lastLoginAt");
    
    // check if the employee not found
    if(!employee) {
        // throw error
        throw new AppError(`Employee not found.`, 404);
    }

    // return
    return employee;
};

// the fields that can change after creation
// userId and employeeCode can not be change
const UPDATABLE_FIELDS = [
    `firstName`,
    `lastName`,
    `phone`,
    `department`,
    `jobTitle`,
    `basicSalary`,
    `employmentStatus`,
    `location`,
    `emergencyContact`,
    `leaveBalance`,
];

// update employee data
const updateEmployee = async (id, data, photoFileName) => {
    // get employee by ID
    const employee = await Employee.findById(id);

    // check if employee not found
    if(!employee) {
        // throw error
        throw new AppError(`Employee not found.`, 404);
    }

    // update updatable fields only (ignore else)
    UPDATABLE_FIELDS.forEach(field => {
        if(data[field] !== undefined) {
            employee[field] = data[field];
        }
    });

    // update the photo if a new photo uploded (with multer)
    // check if photo is defined
    if(photoFileName) {
        employee.photoFileName = photoFileName;
    }

    // save to database
    await employee.save();

    // return
    return employee;
};

// delete employee (Soft delete)
const deleteEmployee = async (id) => {
    // get employee by ID
    const employee = await Employee.findById(id);

    // check if the employee not found
    if(!employee) {
        // throw error
        throw new AppError(`Employee not found.`, 404);
    }

    // make employment status as terminated
    employee.employmentStatus = `terminated`;

    // save to database
    await employee.save();

    // make the user can not login
    // change the account status to "suspended"
    await User.findByIdAndUpdate(employee.userId, { accountStatus: "suspended" });

    // return
    return employee;
};

// exporting
module.exports = {
    createEmployee,
    listEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};