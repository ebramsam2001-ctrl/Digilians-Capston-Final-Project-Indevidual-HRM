// use strict mode
"use strict";

// requires
const mongoose = require("mongoose");

// mongoose schema
const documentSchema = new mongoose.Schema({
    // The employee this document belongs to
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: [true, `employeeId is required`],
        index: true,
    },
    
    // Category of document
    documentType: {
        type: String,
        required: [true, `documentType is required`],
        enum: {
            values: [
                "contract",
                "national_id",
                "certificate",
                "warning_letter",
                "performance_review",
                "offer_letter",
                "resignation_letter",
                "other",
            ],
            message: `Invalid document type.`,
        },
        index: true,
    },

    // Human-readable label set by HR
    title: {
        type: String,
        required: [true, `title is required`],
        trim: true,
        maxlength: [200, `title must be 200 characters or fewer.`],
    },

    // Path on disk (relative to uploads root)
    filePath: {
        type: String,
        required: [true, `filePath is required`],
    },

    // Original filename as uploaded
    originalName: {
        type: String,
        required: [true, `originalName is required`],
    },

    // MIME type — validated before storage
    mimeType: {
        type: String,
        required: [true, `mimeType is required`],
    },

    // File size in bytes
    fileSize: {
        type: Number,
        required: [true, `fileSize is required`],
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, `notes must be 500 characters or fewer.`],
        default: null,
    },

    // Who uploaded the document
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, `uploadedBy is required`],
    },

    // Optional expiry (for contracts, IDs, certificates)
    expiresAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// indexes
// searching
documentSchema.index({ employeeId: 1, documentType: 1 });
documentSchema.index({ expiresAt: 1 });

// Model
const Document = mongoose.model("Document", documentSchema);

// exporting
module.exports = Document;