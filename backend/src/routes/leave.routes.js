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
const { submitLeaveValidators, rejectLeaveValidators } = require("../validators/leave.validators");

// controllers
const {
    submitLeave,
    listLeaves,
    approveLeave,
    rejectLeave,
    cancelLeave,
} = require("../controllers/leave.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

router.post("/", validate(submitLeaveValidators), submitLeave);
router.get("/", listLeaves);
router.patch("/:id/approve", roleGuard("hr_admin", "super_admin"), approveLeave);
router.patch("/:id/reject", roleGuard("hr_admin", "super_admin"), validate(rejectLeaveValidators), rejectLeave);
router.delete("/:id", roleGuard("employee", "hr_admin", "super_admin"), cancelLeave);

// exporting
module.exports = router;