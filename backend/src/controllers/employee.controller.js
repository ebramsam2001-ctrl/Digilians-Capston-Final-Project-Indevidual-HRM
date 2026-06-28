// use strict mode
"use strict"

// requires
// services
const employeeService = require("../services/employee.service");

// utils
const { asyncHandler, sendSuccess } = require("../utils/helpers");

// functions
// create employee
const createEmployee = asyncHandler(async (req, res) => {
    // use employee create employee service
    const { user, employee } = await employeeService.createEmployee(
        req.body,
        req.userId,
        req.ip,
        req.headers["user-agent"],
    );

    // return
    return sendSuccess(
        res,
        {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            employee,
        },
        "Employee created successfully.",
        201,
    );
});

// list employees
const listEmployees = asyncHandler(async (req, res) => {
    const { page, limit, search, department, status } = req.query;

    // use employee list employees service
    const result = await employeeService.listEmployees({
        page: page,
        limit: limit,
        search: search,
        department: department,
        status: status,
    });

    // return
    return sendSuccess(res, result, "Employees fetched successfully.");
});

// get employee
const getEmployee = asyncHandler(async (req, res) => {
    // use employee get employee by ID service
    const employee = await employeeService.getEmployeeById(req.params.id);

    // return
    return sendSuccess(res, { employee }, "Employee fetched successfully.");
});

// update employee
const updateEmployee = asyncHandler(async (req, res) => {
    // If a photo was uploaded, multer puts the filename in req.file
    const photoFileName = req.file ? req.file.filename : undefined;

    // use employee update employee service
    const employee = await employeeService.updateEmployee(
        req.params.id,
        req.body,
        photoFileName,
        req.userId,
        req.ip,
        req.headers["user-agent"]
    );

    // return
    return sendSuccess(res, { employee }, "Employee updated successfully.");
});

// delete employee
const deleteEmployee = asyncHandler(async (req, res) => {
    // use employee delete employee service
    const employee = await employeeService.deleteEmployee(
        req.params.id,
        req.userId,
        req.ip,
        req.headers["user-agent"],
    );

    // return
    return sendSuccess(res, { employee }, "Employee terminated successfully.");
});

// exporting
module.exports = {
    createEmployee,
    listEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee,
};