// use strict mode
"use strict"

// requires
// libraries
// const fs = require("fs");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");

// utils
const { AppError } = require("../utils/helpers");

// functions
// helper
const randomFilename = (ext) => {
    const result = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;;

    return result;
};

// photo
// photo storage
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../uploads/photos"));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, randomFilename(ext));
    },
});

// photo filter
const photoFilter = (req, file, cb) => {
    // white list
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        return cb(
            new AppError(`Only JPEG, PNG, and WebP images are allowed.`, 400),
            false,
        );
    }

    cb(null, true);
};

// photo upload
const photoUpload = multer({
    storage: photoStorage,
    fileFilter: photoFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024,
        files: 1,
    },
});

// document
// document storage
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../uploads/documents"));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, randomFilename(ext));
    },
});

// document filter
const documentFilter = (req, file, cb) => {
    // white list
    const allowed = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
        return cb(
            new AppError(`Only PDF, JPEG, PNG, DOC, and DOCX files are allowed.`, 400),
            false,
        );
    }

    cb(null, true);
};

// document upload
const documentUpload = multer({
    storage: documentStorage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
});

// exporting
module.exports = { photoUpload, documentUpload, };