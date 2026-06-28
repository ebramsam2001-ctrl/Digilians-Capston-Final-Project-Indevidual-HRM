// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");

// middlewares
const authMiddleware = require("../middlewares/auth.middleware");
const roleGuard = require("../middlewares/roleguard.middleware");
const validate = require("../middlewares/validate.middleware");
const { photoUpload } = require("../middlewares/upload.middleware");
const { documentUpload } = require("../middlewares/upload.middleware");

// validators
const { createEmployeeValidators, updateEmployeeValidators } = require("../validators/employee.validators");

// controllers
const { uploadDocument, listDocuments } = require("../controllers/document.controller");

const {
    createEmployee,
    listEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee,
} = require("../controllers/employee.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

// HR Admin only — create / delete
router.post(
    "/",
    roleGuard("hr_admin", "super_admin"),
    validate(createEmployeeValidators),
    createEmployee
);

router.get("/", roleGuard("hr_admin", "super_admin"), listEmployees);

router.get("/:id", getEmployee); // HR Admin + employees (employee can view own profile)

router.put(
    "/:id",
    roleGuard("hr_admin", "super_admin"),
    photoUpload.single("photo"),
    validate(updateEmployeeValidators),
    updateEmployee
);

router.delete(
    "/:id",
    roleGuard("hr_admin", "super_admin"),
    deleteEmployee
);

// Document sub-routes
router.post(
    "/:employeeId/documents",
    roleGuard("hr_admin", "super_admin"),
    documentUpload.single("file"),
    uploadDocument
);

router.get(
    "/:employeeId/documents",
    listDocuments
);

// exporting
module.exports = router;
