// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");

// middlewares
const authMiddleware = require("../middlewares/auth.middleware");
const roleGuard = require("../middlewares/roleguard.middleware");
const validate = require("../middlewares/validate.middleware");

// validators
const { settingsValidators } = require("../validators/settings.validators");

// controllers
const { getSettings, updateSettings } = require("../controllers/settings.controller");

// make the router
const router = Router();

// Any authenticated user can read settings (frontend needs them for display)
router.get("/", authMiddleware, getSettings);

// Only HR Admin / Super Admin can update
router.put(
    "/",
    authMiddleware,
    roleGuard("hr_admin", "super_admin"),
    validate(settingsValidators),
    updateSettings
);

// exporting
module.exports = router;