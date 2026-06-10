// use use strict mode
"use strict"

// requires
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { AppError } = require("../utils/helpers");

// path of the folder of photos
const uploadDir = path.join(__dirname, "../uploads/photos");

// check if the folder not exist create it
if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });  // to make all folders in the path
}

// store the file in the disk (Not RAM)
const storage = multer.diskStorage({
    // determine folder destination
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    // file name
    filename: (req, file, cb) => {
        const extintion = path.extname(file.originalname).toLowerCase();
        const userId = req.userId || "unknown";
        const fileName = `${userId}-${Date.now()}${extintion}`;

        cb(null, fileName);
    },
});

// make white list for photos only
const allowedMIMETypes = ["image/jpeg", "image/png", "image/webp"];

// filter files
const fileFilter = (req, file, cb) => {
    // check if file type in the white list
    if(allowedMIMETypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new AppError(`Invalid file type. Only JPEG, PNG, and WebP images are allowed.`, 415),
            false
        );
    }
};

// make maxmum size of photo (make it 2Mb)
const maxSize = parseInt(process.env.MAX_FILE_SIZE, 10) || (2 * 1024 * 1024); // 10 -> Base 10 (decimal system)

// define the file properties
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: maxSize },
});

// make it take one photo
const uploadPhoto = upload.single("photo");

// exporting
module.exports = { uploadPhoto, uploadDir };