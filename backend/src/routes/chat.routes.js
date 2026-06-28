// use strict mode
"use strict";

// requires
// libraries
const { Router } = require("express");

// middlewares
const authMiddleware = require("../middlewares/auth.middleware");

// controllers
const {
    sendMessage,
    getConversation,
    markConversationRead,
    getUnreadCount,
    getInbox,
} = require("../controllers/chat.controller");

// make the router
const router = Router();

// router auth middleware
router.use(authMiddleware);

// end points
router.post("/messages", sendMessage);
router.get("/messages/:userId", getConversation);
router.patch("/messages/:senderId/read", markConversationRead);
router.get("/unread-count", getUnreadCount);
router.get("/inbox", getInbox);

// exporting
module.exports = router;
