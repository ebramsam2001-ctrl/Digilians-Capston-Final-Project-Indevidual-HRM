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
    downloadDocument,
    deleteDocument,
} = require("../controllers/document.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

// Download — available to the employee it belongs to and HR (ownership check is in the service)
router.get("/:id/download", downloadDocument);

// Delete — HR Admin only
router.delete("/:id", roleGuard("hr_admin", "super_admin"), deleteDocument);

// exporting
module.exports = router;
