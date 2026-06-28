// use strict mode
"use strict"

// requires
// utils
const { asyncHandler, sendSuccess } = require("../utils/helpers");

// services
const notificationService = require("../services/notification.service");


// functions
// get notifications
const getNotifications = asyncHandler(async (req, res) => {
    // extract query options
    const { unreadOnly, page, limit } = req.query;

    // use list notifications service
    const result = await notificationService.listNotifications(
        req.userId,
        {
            unreadOnly: unreadOnly === "true",
            page:  parseInt(page)  || 1,
            limit: parseInt(limit) || 20,
        }
    );

    // return
    return sendSuccess(res, result, `Notifications fetched successfully.`);
});

// mark as read
const markAsRead = asyncHandler(async (req, res) => {
    // use make as read service
    const notification = await notificationService.markAsRead(
        req.params.id,
        req.userId
    );

    // return
    return sendSuccess(res, { notification }, `Notification marked as read.`);
});

// mark all as read
const markAllAsRead = asyncHandler(async (req, res) => {
    // use make all as read service
    const result = await notificationService.markAllAsRead(req.userId);

    // return
    return sendSuccess(res, { modifiedCount: result.modifiedCount }, `All notifications marked as read.`);
});

// delete notification
const deleteNotification = asyncHandler(async (req, res) => {
    // use delete notification service
    await notificationService.deleteNotification(req.params.id, req.userId);

    // return
    return sendSuccess(res, null, `Notification deleted.`);
});

// exporting
module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};