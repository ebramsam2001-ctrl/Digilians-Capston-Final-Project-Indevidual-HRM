// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");

// middlewares
const authMiddleware = require("../middlewares/auth.middleware");

// controllers
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/notification.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);       // Must come before /:id routes
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

// exporting
module.exports = router;