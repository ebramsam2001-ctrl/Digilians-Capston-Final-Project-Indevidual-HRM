// use strict mode
"use strict";

// requires
// services
const notificationService = require("../../services/notification.service");

/*
registerNotificationHandlers
Incoming events from the client:
    notification:read-all  → mark all notifications as read

Outgoing events to the client (emitted by controllers/services via emitToUser):
    notification:new        → { notification }
    notification:read-all   → acknowledgement after bulk mark-read
*/
// register notification handlers
const registerNotificationHandlers = (io, socket) => {
    // Client requests bulk mark-as-read via socket (alternative to REST endpoint)
    socket.on("notification:read-all", async (_, callback) => {
        try {
            // use notification mark all as read service
            const result = await notificationService.markAllAsRead(socket.userId);
            // Acknowledge the event back to the sender
            if (typeof callback === "function") {
                callback({
                    success: true,
                    modifiedCount: result.modifiedCount,
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
};

// exporting
module.exports = registerNotificationHandlers;
