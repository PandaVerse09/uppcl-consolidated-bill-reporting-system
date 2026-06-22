const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const ConsolidatedReport = require("../models/consolidatedReport.model");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { normalizeDate, endOfDay } = require("../services/report.service");
const { logAudit } = require("../services/audit.service");

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sanitizeReport(report, divisionFilter = null) {
  const divisions = divisionFilter
    ? report.divisions.filter((division) => division.division === divisionFilter)
    : report.divisions;

  const totals = divisions.reduce(
    (acc, division) => {
      acc.totalBank += division.bankAmount;
      acc.totalGateway += division.gatewayAmount;
      acc.totalBilling += division.billingAmount;
      acc.grandTotal += division.total;
      return acc;
    },
    {
      totalBank: 0,
      totalGateway: 0,
      totalBilling: 0,
      grandTotal: 0,
    },
  );

  return {
    id: report._id,
    date: report.date,
    divisions,
    totals: divisionFilter ? totals : report.totals,
    generatedAt: report.generatedAt,
    generatedBy: report.generatedBy,
    status: "published",
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

function buildReportFilter(req) {
  const filter = {};

  if (req.query.from || req.query.to) {
    filter.date = {};

    if (req.query.from) {
      filter.date.$gte = normalizeDate(req.query.from);
    }

    if (req.query.to) {
      filter.date.$lte = endOfDay(req.query.to);
    }
  }

  if (req.query.division) {
    filter["divisions.division"] = req.query.division;
  }

  return filter;
}

async function findReportByDate(req) {
  const date = normalizeDate(req.params.date);

  const report = await ConsolidatedReport.findOne({
    date: {
      $gte: date,
      $lte: endOfDay(date),
    },
  }).populate("generatedBy", "name email role");

  if (!report) {
    throw new ApiError(404, "Report not found for the requested date");
  }

  return report;
}

const listReports = catchAsync(async (req, res) => {
  const filter = buildReportFilter(req);
  const reports = await ConsolidatedReport.find(filter)
    .populate("generatedBy", "name email role")
    .sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: reports.length,
    reports: reports.map((report) => sanitizeReport(report, req.query.division)),
  });
});

const getReportByDate = catchAsync(async (req, res) => {
  const report = await findReportByDate(req);

  res.status(200).json({
    success: true,
    report: sanitizeReport(report, req.query.division),
  });
});

const exportReportPdf = catchAsync(async (req, res) => {
  const report = sanitizeReport(await findReportByDate(req), req.query.division);
  const fileDate = formatDate(report.date);
  await logAudit({
    action: "EXPORT_PDF",
    req,
    targetId: report.id,
    targetCollection: "consolidatedReports",
    date: report.date,
    note: req.query.division ? `Division filter: ${req.query.division}` : undefined,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="cbs-report-${fileDate}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(16).text("UPPCL Consolidated Billing System", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(13).text(`Daily Consolidated Report - ${fileDate}`, { align: "center" });
  doc.moveDown();

  doc.fontSize(10);
  doc.text("Division", 40, doc.y, { continued: true, width: 130 });
  doc.text("Bank ID", 170, doc.y, { continued: true, width: 90, align: "right" });
  doc.text("Gateway", 260, doc.y, { continued: true, width: 90, align: "right" });
  doc.text("Billing", 350, doc.y, { continued: true, width: 90, align: "right" });
  doc.text("Total", 440, doc.y, { width: 90, align: "right" });
  doc.moveDown(0.5);

  report.divisions.forEach((division) => {
    doc.text(division.division, 40, doc.y, { continued: true, width: 130 });
    doc.text(division.bankAmount.toFixed(2), 170, doc.y, {
      continued: true,
      width: 90,
      align: "right",
    });
    doc.text(division.gatewayAmount.toFixed(2), 260, doc.y, {
      continued: true,
      width: 90,
      align: "right",
    });
    doc.text(division.billingAmount.toFixed(2), 350, doc.y, {
      continued: true,
      width: 90,
      align: "right",
    });
    doc.text(division.total.toFixed(2), 440, doc.y, { width: 90, align: "right" });
  });

  doc.moveDown();
  doc.text("Totals", 40, doc.y, { continued: true, width: 130 });
  doc.text(report.totals.totalBank.toFixed(2), 170, doc.y, {
    continued: true,
    width: 90,
    align: "right",
  });
  doc.text(report.totals.totalGateway.toFixed(2), 260, doc.y, {
    continued: true,
    width: 90,
    align: "right",
  });
  doc.text(report.totals.totalBilling.toFixed(2), 350, doc.y, {
    continued: true,
    width: 90,
    align: "right",
  });
  doc.text(report.totals.grandTotal.toFixed(2), 440, doc.y, { width: 90, align: "right" });

  doc.moveDown();
  doc.text(`Generated At: ${report.generatedAt.toISOString()}`);
  doc.end();
});

const exportReportExcel = catchAsync(async (req, res) => {
  const report = sanitizeReport(await findReportByDate(req), req.query.division);
  const fileDate = formatDate(report.date);
  await logAudit({
    action: "EXPORT_EXCEL",
    req,
    targetId: report.id,
    targetCollection: "consolidatedReports",
    date: report.date,
    note: req.query.division ? `Division filter: ${req.query.division}` : undefined,
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Daily Report");

  sheet.columns = [
    { header: "Division", key: "division", width: 24 },
    { header: "Bank ID Amount", key: "bankAmount", width: 18 },
    { header: "Gateway Amount", key: "gatewayAmount", width: 18 },
    { header: "Billing Amount", key: "billingAmount", width: 18 },
    { header: "Total", key: "total", width: 18 },
  ];

  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = "UPPCL Consolidated Billing System";
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A1").alignment = { horizontal: "center" };

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = `Daily Consolidated Report - ${fileDate}`;
  sheet.getCell("A2").alignment = { horizontal: "center" };

  sheet.spliceRows(3, 0, []);
  sheet.getRow(4).values = ["Division", "Bank ID Amount", "Gateway Amount", "Billing Amount", "Total"];
  sheet.getRow(4).font = { bold: true };

  report.divisions.forEach((division) => {
    sheet.addRow({
      division: division.division,
      bankAmount: division.bankAmount,
      gatewayAmount: division.gatewayAmount,
      billingAmount: division.billingAmount,
      total: division.total,
    });
  });

  const totalRow = sheet.addRow({
    division: "Totals",
    bankAmount: report.totals.totalBank,
    gatewayAmount: report.totals.totalGateway,
    billingAmount: report.totals.totalBilling,
    total: report.totals.grandTotal,
  });
  totalRow.font = { bold: true };

  sheet.addRow([]);
  sheet.addRow(["Generated At", report.generatedAt.toISOString()]);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="cbs-report-${fileDate}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  listReports,
  getReportByDate,
  exportReportPdf,
  exportReportExcel,
};
