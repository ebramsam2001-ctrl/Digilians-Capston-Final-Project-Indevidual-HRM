// express
const express = require("express");

// app
const app = express();

// middleware json
app.use(express.json());

// connection DB
const connectDB = require("./config/db");

connectDB();

// simple logger
if(process.env.NODE_ENV === "dev") {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
        next();
    });
}

// Test rout
app.get("/health", (req, res, next) => {
    return res.status(200).json({message: "☑️ All things is good"});
});

// Port
const PORT = process.env.PORT || 8000;

// Run server
app.listen(PORT, () => {
    console.log(`Server is running in: ${PORT}`);
});

// exporting
module.exports = app;