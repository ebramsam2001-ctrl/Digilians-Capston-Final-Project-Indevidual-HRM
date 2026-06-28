// use strict mode
"use strict";

/*
registerPresenceHandlers

Incoming events:
    presence:get-online-users   — request current online user list

Outgoing events:
    user:online                 { userId }        — broadcast when user connects
    user:offline                { userId }        — broadcast when user disconnects
    presence:online-users       { onlineUserIds } — response to get-online-users
*/
// register presence handlers
const registerPresenceHandlers = (io, socket, onlineUsers) => {
    // Broadcast this user's online status to all connected clients
    socket.broadcast.emit("user:online", { userId: socket.userId });

    // Respond to a request for the current online users list
    socket.on("presence:get-online-users", (_, callback) => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        if (typeof callback === "function") {
            callback({
                success: true,
                onlineUserIds: onlineUserIds,
            });
        } else {
            socket.emit("presence:online-users", { onlineUserIds });
        }
    });
};

module.exports = registerPresenceHandlers;
