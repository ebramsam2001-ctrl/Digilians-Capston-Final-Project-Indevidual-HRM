// use strict mode
"use strict";

// requires
// services
const chatService = require("../../services/chat.service");

/*
registerChatHandlers

Incoming events:
    chat:message          { receiverId, content }
    chat:typing           { receiverId }
    chat:stop-typing      { receiverId }
    chat:read             { senderId }

Outgoing events:
    chat:message          { message }        → sent to receiver
    chat:typing           { senderId }       → sent to receiver
    chat:stop-typing      { senderId }       → sent to receiver
    chat:read             { readBy, count }  → sent to original sender
*/
// register chat handlers
const registerChatHandlers = (io, socket, onlineUsers) => {
    // Send message
    socket.on("chat:message", async (data, callback) => {
        try {
            const { receiverId, content } = data || {};

            if (!receiverId || !content?.trim()) {
                if (typeof callback === "function") {
                    callback({ success: false, message: "receiverId and content are required." });
                }
                return;
            }

            const message = await chatService.sendMessage(socket.userId, receiverId, content);

            // Deliver to receiver if online (they may be in multiple tabs)
            io.to(`user:${receiverId}`).emit("chat:message", { message });

            // Echo back to sender for multi-tab sync
            socket.emit("chat:message", { message });

            if (typeof callback === "function") {
                callback({
                    success: true,
                    message: message,
                });
            }
        } catch (err) {
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: err.message,
                });
            }
        }
    });

    // Typing indicator
    socket.on("chat:typing", ({ receiverId } = {}) => {
        if (!receiverId) {
            return;
        }

        io.to(`user:${receiverId}`).emit("chat:typing", { senderId: socket.userId });
    });

    // Stop typing indicator
    socket.on("chat:stop-typing", ({ receiverId } = {}) => {
        if (!receiverId) {
            return;
        }

        io.to(`user:${receiverId}`).emit("chat:stop-typing", { senderId: socket.userId });
    });

    // Read receipt
    socket.on("chat:read", async ({ senderId } = {}, callback) => {
        try {
            if (!senderId) {
                return;
            }

            // use chat mark conversation read service
            const result = await chatService.markConversationRead(socket.userId, senderId);

            // Notify the original sender that their messages were read
            io.to(`user:${senderId}`).emit("chat:read", {
                readBy: socket.userId,
                modifiedCount: result.modifiedCount,
            });

            if (typeof callback === "function") {
                callback({ success: true });
            }
        } catch (err) {
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: err.message,
                });
            }
        }
    });
};

// exporting
module.exports = registerChatHandlers;