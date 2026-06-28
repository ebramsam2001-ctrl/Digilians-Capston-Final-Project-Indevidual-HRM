// use strict mode
"use strict"

// requires
// libraries
const PDFDocument = require("pdfkit");

// services
const reportService = require("../services/report.service");
const auditService = require("../services/audit.service");

// utils
const { asyncHandler, AppError, sendSuccess } = require("../utils/helpers");

// functions
// getSummary
const getSummary = asyncHandler(async (req, res) => {
    // use get summary service
    const data = await reportService.getSummary();

    // return
    return sendSuccess(res, data, `Summary report fetched successfully.`);
});

// get attendance report
const getAttendanceReport = asyncHandler(async (req, res) => {
    // get the Date range from the request
    const { startDate, endDate } = req.query;

    // check if any of start and end date not existing
    if (!startDate || !endDate) {
        // throw error
        throw new AppError(`startDate and endDate query parameters are required.`, 400);
    }

    // validate date
    if (new Date(startDate) > new Date(endDate)) {
        // throw error
        throw new AppError(`startDate must be before endDate.`, 400);
    }

    // use get attendance report service
    const date = await reportService.getAttendanceReport(startDate, endDate);

    // return
    return sendSuccess(res, data, `Attendance report fetched successfully.`);
});

// get leave report
const getLeaveReport = asyncHandler(async (req, res) => {
    // get month from the request
    const { month } = req.query;

    // validate over month
    if (month && !(/^\d{4}-(0[1-9]|1[0-2])$/.test(month))) {
        // throw error
        throw new AppError(`month must be in YYYY-MM format.`, 400);
    }

    // use get leave report service
    const data = await reportService.getAttendanceReport(month);

    // return
    return sendSuccess(res, data, `Leave report fetched successfully.`);
});

// get payroll report
const getPayrollReport = asyncHandler(async (req, res) => {
    // get month from the request
    const { month } = req.query;

    // validate over month
    if (month && !(/^\d{4}-(0[1-9]|1[0-2])$/.test(month))) {
        // throw error
        throw new AppError(`month must be in YYYY-MM format.`, 400);
    }

    // use get payroll report service
    const data = await reportService.getPayrollReport(month);

    // return
    return sendSuccess(res, data, `Payroll report fetched successfully.`);
});

// export report
const exportReport = asyncHandler(async (req, res) => {
    // extract data from request query
    const { type, format = "csv", month, startDate, endDate } = req.query;

    // type validation
    const validTypes = ["attendance", "leave", "payroll"];

    // check if not valid
    if (!validTypes.includes(type)) {
        // throw error
        throw new AppError(`type not valid`, 400);
    }

    // format validation
    const validFormats = ["csv", "pdf"];

    // check if not valid
    if (!validFormats.includes(format)) {
        // throw error
        throw new AppError(`format must be csv or pdf.`, 400);
    }

    // use get export data service
    const rows = await reportService.getExportData({
        type: type,
        month: month,
        startDate: startDate,
        endDate: endDate,
    });

    // check if no rows
    if (!rows.length) {
        // throw error
        throw new AppError(`No data found for the specified parameters.`, 404);
    }

    // CSV export
    if (format === "csv") {
        // extract headers from first row keys
        const headers = Object.keys(rows[0]);

        // build CSV string
        const csvLines = [
            headers.join(","),
            ...rows.map((row) => {
                return headers.map((h) => {
                    // wrap values containing commas or quotes in double-quotes
                    const val = row[h] !== null && row[h] !== undefined ? String(row[h]) : "";
                    return val.includes(",") || val.includes('"') || val.includes("\n")
                        ? `"${val.replace(/"/g, '""')}"`
                        : val;
                }).join(",");
            }),
        ];

        // separete csv lines
        const csvContent = csvLines.join("\n");

        // set response headers
        const filename = `hrm_${type}_${month || startDate || "export"}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        return res.send(csvContent);
    }

    // PDF export
    if (format === "pdf") {
        // set response headers
        const filename = `hrm_${type}_${month || startDate || "export"}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        // create pdf document and pipe to response
        const document = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

        document.pipe(res);

        // ── Title ──
        document.fontSize(16)
            .fillColor("#1a56db")
            .text(`HRM Pro — ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, {
                align: "center",
            });

        document.fontSize(10)
            .fillColor("#6b7280")
            .text(`Generated: ${new Date().toISOString().split("T")[0]}`, {
                align: "center",
            });

        document.moveDown(1.5);

        // ── Table headers ──
        const headers = Object.keys(rows[0]);
        const colWidth = Math.floor((document.page.width - 80) / headers.length);

        // header row background
        document.rect(40, document.y, document.page.width - 80, 16).fill("#1a56db");

        let x = 40;
        let headerY = document.y - 14;
        headers.forEach((h) => {
            document.fillColor("#ffffff")
                .fontSize(7)
                .text(h.toUpperCase(), x + 2, headerY, {
                    width: colWidth - 4,
                    ellipsis: true,
                });
            x += colWidth;
        });

        document.moveDown(0.3);

        // ── Data rows ──
        rows.forEach((row, idx) => {
            // alternate row background
            if (idx % 2 === 0) {
                document.rect(40, document.y, document.page.width - 80, 14).fill("#f3f4f6");
            }

            x = 40;
            const rowY = document.y - 12;

            headers.forEach((h) => {
                document.fillColor("#111827")
                    .fontSize(7)
                    .text(
                        row[h] !== null && row[h] !== undefined ? String(row[h]) : "",
                        x + 2,
                        rowY,
                        { width: colWidth - 4, ellipsis: true }
                    );
                x += colWidth;
            });

            document.moveDown(0.3);

            // add new page if near bottom
            if (document.y > document.page.height - 60) {
                document.addPage();
            }
        });

        // finalize PDF
        document.end();
        return; // response is handled by pipe
    }
});

// get audit logs
const getAuditLogs = asyncHandler(async (req, res) => {
    const { actorId, action, resource, status, dateFrom, dateTo, page, limit } = req.query;

    // use audit list audit logs service
    const result = await auditService.listAuditLogs({
        actorId: actorId,
        action: action,
        resource: resource,
        status: status,
        dateFrom: dateFrom,
        dateTo: dateTo,
        page: page,
        limit: limit,
    });

    // return
    return sendSuccess(res, result, "Audit logs fetched.");
});

// exporting
module.exports = {
    getSummary,
    getAttendanceReport,
    getLeaveReport,
    getPayrollReport,
    exportReport,
    getAuditLogs,
};