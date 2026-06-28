// use strict mode
"use strict";

// requires
// libraries
const path = require("path");

// services
const documentService = require("../services/document.service");

// utils
const { asyncHandler, AppError, sendSuccess } = require("../utils/helpers");

// functions
// upload document
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        // throw error
        throw new AppError(`A file is required.`, 400);
    }

    // use document upload document service
    const document = await documentService.uploadDocument(
        req.params.employeeId,
        req.file,
        req.body,
        req.userId
    );

    // return
    return sendSuccess(res, { document }, "Document uploaded.", 201);
});

// list documents
const listDocuments = asyncHandler(async (req, res) => {
    const { documentType, page, limit } = req.query;

    // use document list documents service
    const result = await documentService.listDocuments(req.params.employeeId, {
        documentType: documentType,
        page: page,
        limit: limit,
    });

    // return
    return sendSuccess(res, result, "Documents fetched.");
});

// download document
const downloadDocument = asyncHandler(async (req, res) => {
    // use document get document by ID service
    const document = await documentService.getDocumentById(
        req.params.id,
        req.role,
        req.userId
    );

    // Stream the file
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.originalName}"`
    );
    res.sendFile(path.resolve(document.filePath));
});

// delete document
const deleteDocument = asyncHandler(async (req, res) => {
    // use document delete document service
    await documentService.deleteDocument(req.params.id);

    // return
    return sendSuccess(res, null, "Document deleted.");
});

// exporting
module.exports = {
    uploadDocument,
    listDocuments,
    downloadDocument,
    deleteDocument,
};