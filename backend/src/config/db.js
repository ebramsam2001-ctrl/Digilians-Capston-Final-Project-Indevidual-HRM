// use strict mode
"use strict"

// requires
// libraries
const mongoose = require("mongoose");

// in dev mood we want to get the error quickly
// makes queries fail immediately if the DB is not connected
mongoose.set(`bufferCommands`, false);

// connect to database
const connectDB = async () => {
    const url = process.env.MONGO_URI;

    if(!url) {
        throw new Error(`MONGO_URI is not defined in .env`);
    }

    try {
        const connected = await mongoose.connect(url, {
            maxPoolSize: 10, // make 10 chanals to request pressure handling and speedly
            serverSelectionTimeoutMS: 5000, // the connection methode will wait max: 5 Sec to not wait forever
        });

        console.log(`MongoDB connected: ${connected.connection.host}`);
    } catch (error) {
        console.error(`MongoDB error: ${error.message}`);

        // close the backend with error
        // close the app if the database connection faild
        process.exit(1);
    }
};

// exporting
module.exports = connectDB;