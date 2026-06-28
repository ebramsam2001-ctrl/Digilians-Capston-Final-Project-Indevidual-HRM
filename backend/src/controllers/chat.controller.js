// use strict mode
"use strict";

// requires
// services
const chatService = require("../services/chat.service");

// utils
const { asyncHandler, AppError, sendSuccess } = require("../utils/helpers");

// functions
// send message
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, content } = req.body;

    if (!receiverId || !content?.trim()) {
        // throw error
        throw new AppError("receiverId and content are required.", 400);
    }

    // use chat send message service
    const message = await chatService.sendMessage(req.userId, receiverId, content);

    // return
    return sendSuccess(res, { message }, "Message sent.", 201);
});

// get conversation
const getConversation = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    // use chat get cinversation service
    const result = await chatService.getConversation(
        req.userId,
        req.params.userId,
        { page, limit }
    );

    // return
    return sendSuccess(res, result, "Conversation fetched.");
});

// mark conversation read
const markConversationRead = asyncHandler(async (req, res) => {
    // use chat mark conversation read service
    const result = await chatService.markConversationRead(req.userId, req.params.senderId);

    // return
    return sendSuccess(res, { modifiedCount: result.modifiedCount }, "Messages marked as read.");
});

// get unread count
const getUnreadCount = asyncHandler(async (req, res) => {
    // use chat get unread count service
    const count = await chatService.getUnreadCount(req.userId);

    // return
    return sendSuccess(res, { unreadCount: count }, "Unread count fetched.");
});

// get inbox
const getInbox = asyncHandler(async (req, res) => {
    // use chat get inbox list service
    const inbox = await chatService.getInboxList(req.userId);

    // return
    return sendSuccess(res, { inbox }, "Inbox fetched.");
});

// exporting
module.exports = {
    sendMessage,
    getConversation,
    markConversationRead,
    getUnreadCount,
    getInbox,
};