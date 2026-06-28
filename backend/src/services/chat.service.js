// use strict mode
"use strict";

// requires
// models
const Message = require("../models/Message.model");
const User = require("../models/User.model");

// utils
const { AppError } = require("../utils/helpers");

// functions
// send message
const sendMessage = async (senderId, receiverId, content) => {
    // get receiver by ID 
    const receiver = await User.findById(receiverId);

    // check if receiver is exist
    if (!receiver) {
        // throw error
        throw new AppError(`Recipient not found.`, 404);
    }

    // Prevent self-messaging
    if (senderId.toString() === receiverId.toString()) {
        throw new AppError("You cannot send a message to yourself.", 400);
    }

    // Sort participants for consistent conversation keying
    const participants = [senderId, receiverId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
    );

    // message creation
    const message = await Message.create({
        participants: participants,
        sender: senderId,
        receiver: receiverId,
        content: content,
    });

    // return
    return message;
};

// get conversation
const getConversation = async (userAId, userBId, { page = 1, limit = 50 } = {}) => {
    // pagination
    const take = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * take;

    // get if user-A -> user-B
    //        user-B -> user-A
    const query = {
        $or: [
            { sender: userAId, receiver: userBId },
            { sender: userBId, receiver: userAId },
        ],
    };

    // make more than one query in the same time
    const [messages, total] = await Promise.all([
        Message.find(query)
            .populate("sender", "email role")
            .populate("receiver", "email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(take),
        // records count
        Message.countDocuments(query),
    ]);

    // return
    return {
        messages: messages.reverse(), // oldest-first for display
        pagination: {
            total: total,
            page: parseInt(page),
            limit: take,
        },
    };
};

// mark conversation as read
const markConversationRead = async (receiverId, senderId) => {
    // update message isRead
    const result = await Message.updateMany(
        {
            sender: senderId,
            receiver: receiverId,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        }
    );

    // return
    return { modifiedCount: result.modifiedCount };
};

// get unread count
const getUnreadCount = async (userId) => {
    // get count
    const count = Message.countDocuments({
        receiver: userId,
        isRead: false,
    });

    // return
    return count;
};

// list of recent conversations for a user
// get inbox list
const getInboxList = async (userId) => {
    // Aggregate: for each participant pair, get the latest message
    const inbox = await Message.aggregate([
        {
            $match: {
                $or: [
                    { sender: userId },
                    { receiver: userId }
                ],
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: "$participants",
                lastMessage: { $first: "$$ROOT" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$receiver", userId] },
                                    { $eq: ["$isRead", false] }
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        { $sort: { "lastMessage.createdAt": -1 } },
        { $limit: 50 },
    ]);

    // return
    return inbox;
};

// exporting
module.exports = {
    sendMessage,
    getConversation,
    markConversationRead,
    getUnreadCount,
    getInboxList,
};