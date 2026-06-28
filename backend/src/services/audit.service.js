// use strict mode
"use strict";

// requires
// models
const AuditLog = require("../models/AuditLog.model");

// functions
// create audit log
const log = async ({
    actorId = null,
    actorEmail = null,
    actorRole = null,
    action,
    resource = null,
    resourceId = null,
    changes = null,
    ipAddress = null,
    userAgent = null,
    status = "success",
    errorMessage = null,
}) => {
    try {
        await AuditLog.create({
            actorId: actorId,
            actorEmail: actorEmail,
            actorRole: actorRole,
            action: action,
            resource: resource,
            resourceId: resourceId,
            changes: changes,
            ipAddress: ipAddress,
            userAgent: userAgent,
            status: status,
            errorMessage: errorMessage,
        });
    } catch (error) {
        // Silent failure — log to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("[AUDIT] Failed to write audit log:", err.message);
        }
    }
};

// listAuditLogs
// Super Admin dashboard
const listAuditLogs = async ({
    actorId,
    action,
    resource,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
} = {}) => {
    // make the object to add the options of the searching
    const query = {};

    // check if actorId is defind
    if (actorId) {
        query.actorId = actorId;
    }

    // check if action is defind
    if (action) {
        query.action = action;
    }

    // check if resource is defind
    if (resource) {
        query.resource = resource;
    }

    // check if status is defind
    if (status) {
        query.status = status;
    }

    // check if dateFrom or dateTo is defind
    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
            query.createdAt.$gte = new Date(dateFrom);
        }

        if (dateTo) {
            query.createdAt.$lte = new Date(dateTo);
        }
    }

    // paginatin
    // take: the number of records that actually get
    const take = Math.min(parseInt(limit), 200);

    // skip: the number of records that the database should be skip
    const skip = (parseInt(page) - 1) * take;

    // make more than one query in the same time
    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 }) // Desending
            .skip(skip)
            .limit(take)
            .lean(),
        // records count
        AuditLog.countDocuments(query),
    ]);

    // return
    return { logs, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } };
};

// exporting
module.exports = { log, listAuditLogs };