// use strict mode
"use strict";

// requires
// libraries
const path = require("path");
const fs = require("fs");

// models
const Document = require("../models/Document.model");
const Employee = require("../models/Employee.model");

// utils
const { AppError } = require("../utils/helpers");

// functions
// upload document
const uploadDocument = async (employeeId, fileInfo, docData, uploadedBy) => {
    // get employee by ID
    const employee = await Employee.findById(employeeId);

    // check if the employee exist
    if (!employee) {
        // throw error
        throw new AppError(`Employee not found.`, 404);
    }

    // create the document
    const document = await Document.create({
        employeeId: employeeId,
        documentType: docData.documentType,
        title: docData.title,
        filePath: fileInfo.path,
        originalName: fileInfo.originalname,
        mimeType: fileInfo.mimetype,
        fileSize: fileInfo.size,
        notes: docData.notes || null,
        uploadedBy: uploadedBy,
        expiresAt: docData.expiresAt || null,
    });

    // return
    return document;
};

// list the documents
const listDocuments = async (employeeId, { documentType, page = 1, limit = 20 } = {}) => {
    // make the object to add the options of the searching
    const query = { employeeId };

    // check if the document type is defind
    if (documentType) {
        query.documentType = documentType;
    }

    // pagination
    const take = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * take;

    // make more than one query in the same time
    const [documents, total] = await Promise.all([
        Document.find(query)
            .populate("uploadedBy", "email")
            .sort({ createdAt: -1 }) // Desending
            .skip(skip)
            .limit(take),
        // documents count
        Document.countDocuments(query),
    ]);

    // return
    return {
        documents: documents,
        pagination: {
            total: total,
            page: parseInt(page),
            limit: take,
        },
    };
};

// get document by Id
const getDocumentById = async (id, requestingRole, requestingEmployeeId) => {
    // get the document by ID
    const document = await Document.findById(id)
        .populate("uploadedBy", "email");

    // check if the document existing
    if (!document) {
        // throw error
        throw new AppError(`Document not found.`, 404);
    }

    // validation over role
    if (requestingRole === "employee") {
        // get the employee requisted by ID
        const employee = await Employee.findOne({ userId: requestingEmployeeId });

        // validate over employee
        if (!employee || document.employeeId.toString() !== employee._id.toString()) {
            // throw error
            throw new AppError(`Not authorised.`, 403);
        }
    }

    // return
    return document;
};

// delete document
const deleteDocument = async (id) => {
    // get the document by ID
    const document = await Document.findById(id);

    // check if document existing
    if (!document) {
        // throw error
        throw new AppError(`Document not found.`, 404);
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
    }

    // delete
    await document.deleteOne();

    // return
    return { deleted: true };
};

// exporting
module.exports = {
    uploadDocument,
    listDocuments,
    getDocumentById,
    deleteDocument,
};