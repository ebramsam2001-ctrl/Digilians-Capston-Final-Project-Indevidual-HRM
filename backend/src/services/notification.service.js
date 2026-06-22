// use strict mode
"use strict"

const { parse } = require("node-cron");
// requires
// models
const Notification = require("../models/Notification.model");

// utils
const { AppError } = require("../utils/helpers");

// functions
// create notification
const createNotification = async (userId, type, message, meta = null) => {
    // create notification
    const notification = await Notification.create({
        userId: userId,
        type: type,
        message: message,
        meta: meta,
    });

    // return
    return notification;
};

// list notifications
const listNotifications = async (userId, { unreadOnly = false, page = 1, limit = 20 } = {}) => {
    // make query
    const query = { userId: userId, };

    // filter unread only if requested
    // check if unreadOnly is defined
    if(unreadOnly) {
        query.isRead = false;
    }

    // pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // make more than one query in the same time
    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
                    .sort({ createdAt: -1 }) // Desending
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
        // notification count
        Notification.countDocuments(query),
        // notification count for unreaded
        Notification.countDocuments({
            userId: userId,
            isRead: false, // return unreaded
        }),
    ]);

    // return
    return {
        notifications: notifications,
        unreadCount: unreadCount,
        pagination: {
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

// mark as read
const markAsRead = async (notificationId, userId) => {
    // get the notification by ID
    const notification = await Notification.findById(notificationId);

    // check if notification exist
    if(!notification) {
        // throw error
        throw new AppError(`Notification not found.`, 404);
    }

    // check for ownership
    if(notification.userId.toString() !== userId.toString()) {
        // throw error
        throw new AppError(`Not authorised.`, 403);
    }

    // check if is readed
    if(notification.isRead) {
        // return
        return notification;
    }

    // make notification readed
    notification.isRead = true;
    
    // saveing
    await notification.save();

    // return
    return notification;
};

// mark all as read
const markAllAsRead = async (userId) => {
    // update all notifications
    const result = await Notification.updateMany(
        {
            userId: userId,
            isRead: false,
        },
        // update to is readed
        { $set: { isRead: true } },
    );

    // return
    return { modifiedCount: result.modifiedCount, };
};

// delete notification
const deleteNotification = async (notificationId, userId) => {
    // get the notification by ID
    const notification = await Notification.findById(notificationId);

    // check if exist
    if(!notification) {
        // throw error
        throw new AppError(`Notification not found.`, 404);
    }

    // check for owner ship
    if(notification.userId.toString() !== userId.toString()) {
        // throw error
        throw new AppError(`Not authorised.`, 403);
    }

    // delete notification
    await notification.deleteOne();

    // return
    return { deleted: true, };
};

// exporting
module.exports = {
    createNotification,
    listNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};