// use strict mode
"use strict"

// dotenv
require("dotenv").config();

// require app and coniction to database
const app = require("./app");
const connectDB = require("./config/db");

// Port
const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        await connectDB();

        // Run server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on: ${PORT}`);
        });
    } catch (error) {
        console.error(`❌ Server startup failed: ${error}`);

        process.exit(1);
    }
};

startServer();