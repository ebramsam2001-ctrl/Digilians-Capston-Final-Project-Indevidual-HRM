// use strict mode
"use strict";

// requires
// libraries
const { Server } = require("socket.io");

// utils
const { verifyAccessToken } = require("../utils/tokenUtils");

// handlers
const registerNotificationHandlers = require("./handlers/notification.handler");
const registerChatHandlers = require("./handlers/chat.handler");
const registerPresenceHandlers = require("./handlers/presence.handler");

// functions
const onlineUsers = new Map();

const initSocket = (httpServer) => {
    const io = new Server(
        httpServer,
        {
            cors: {
                origin: process.env.CLIENT_URL,
                credentials: true,
            },
            // Ping every 25s — disconnect after 60s of silence
            pingTimeout: 60000,
            pingInterval: 25000,
        },
    );

    // JWT auth middleware for every socket connection
    io.use((socket, next) => {
        try {
            // Accept token from auth header OR handshake query (for browser clients)
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace("Bearer ", "");

            if (!token) {
                // return
                return next(new Error("Authentication required."));
            }

            const decoded = verifyAccessToken(token);
            // Attach user info to the socket for downstream handlers
            socket.userId = decoded.userId.toString();
            socket.role = decoded.role;

            // next
            next();
        } catch {
            // next error
            next(new Error("Invalid or expired token."));
        }
    });

    // Connection
    io.on("connection", (socket) => {
        const { userId, role } = socket;
        console.log(`🔌 [SOCKET] ${userId} connected (${socket.id})`);

        // Track online status
        onlineUsers.set(userId, socket.id);

        // Join a personal room so other parts of the app can emit to a specific user
        // via: io.to(`user:${userId}`).emit(...)
        socket.join(`user:${userId}`);

        // Register domain-specific handlers
        registerNotificationHandlers(io, socket);
        registerChatHandlers(io, socket, onlineUsers);
        registerPresenceHandlers(io, socket, onlineUsers);

        // ── Disconnect ───────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            onlineUsers.delete(userId);
            // Broadcast offline status to everyone
            io.emit("user:offline", { userId });
            console.log(`🔌 [SOCKET] ${userId} disconnected (${reason})`);
        });
    });

    // return
    return io;
};

// exporting
module.exports = { initSocket };