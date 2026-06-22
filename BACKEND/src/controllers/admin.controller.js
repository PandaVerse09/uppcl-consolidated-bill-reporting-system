const PaymentSubmission = require("../models/paymentSubmission.model");
const ConsolidatedReport = require("../models/consolidatedReport.model");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { generateConsolidatedReport, normalizeDate, endOfDay } = require("../services/report.service");
const { logAudit } = require("../services/audit.service");

function sanitizeSubmission(submission) {
  return {
    id: submission._id,
    division: submission.division,
    date: submission.date,
    bankAmount: submission.bankAmount,
    gatewayAmount: submission.gatewayAmount,
    billingAmount: submission.billingAmount,
    totalAmount: submission.totalAmount,
    status: submission.status,
    uploadedBy: submission.uploadedBy,
    reviewedBy: submission.reviewedBy,
    reviewComment: submission.reviewComment,
    changeReason: submission.changeReason,
    requiresApproval: submission.requiresApproval,
    replacesSubmission: submission.replacesSubmission,
    isBackdate: submission.isBackdate,
    backdateJustification: submission.backdateJustification,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

async function findSubmission(id) {
  const submission = await PaymentSubmission.findById(id)
    .populate("uploadedBy", "name email role division")
    .populate("reviewedBy", "name email role");

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  return submission;
}

async function ensurePreviousReportPublished(dateValue) {
  const date = normalizeDate(dateValue);
  const existingEarlierReport = await ConsolidatedReport.exists({ date: { $lt: date } });

  if (!existingEarlierReport) return;

  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);

  const previousReport = await ConsolidatedReport.exists({
    date: {
      $gte: previousDate,
      $lte: endOfDay(previousDate),
    },
  });

  if (!previousReport) {
    throw new ApiError(400, "Previous date report is missing. Publish the back date report first.");
  }
}

const listPendingSubmissions = catchAsync(async (req, res) => {
  const submissions = await PaymentSubmission.find({ status: "pending" })
    .populate("uploadedBy", "name email role division")
    .populate("replacesSubmission")
    .sort({ date: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions: submissions.map(sanitizeSubmission),
  });
});

const approveSubmission = catchAsync(async (req, res) => {
  const submission = await findSubmission(req.params.id);

  if (submission.status !== "pending") {
    throw new ApiError(400, "Only pending submissions can be approved");
  }
  const oldValue = sanitizeSubmission(submission);
  let replacedSubmission = null;

  if (submission.replacesSubmission) {
    replacedSubmission = await PaymentSubmission.findById(submission.replacesSubmission);
  }

  if (replacedSubmission && replacedSubmission.status === "approved") {
    replacedSubmission.status = "superseded";
    replacedSubmission.reviewedBy = req.user._id;
    replacedSubmission.reviewComment = "Superseded by approved correction";
    await replacedSubmission.save();
  }

  submission.status = "approved";
  submission.reviewedBy = req.user._id;
  submission.reviewComment = req.body.comment;
  submission.requiresApproval = false;
  await submission.save();

  const report = await generateConsolidatedReport(submission.date, req.user._id);
  await logAudit({
    action: "APPROVE",
    req,
    targetId: submission._id,
    targetCollection: "paymentSubmissions",
    division: submission.division,
    date: submission.date,
    oldValue,
    newValue: sanitizeSubmission(submission),
    note: req.body.comment,
  });
  if (replacedSubmission) {
    await logAudit({
      action: "SUPERSEDE",
      req,
      targetId: replacedSubmission._id,
      targetCollection: "paymentSubmissions",
      division: replacedSubmission.division,
      date: replacedSubmission.date,
      newValue: sanitizeSubmission(replacedSubmission),
      note: "Previous approved submission superseded by admin-approved correction",
    });
  }
  await logAudit({
    action: "REPORT_GENERATION",
    req,
    targetId: report._id,
    targetCollection: "consolidatedReports",
    date: report.date,
    newValue: report,
    note: "Report regenerated after approval",
  });

  res.status(200).json({
    success: true,
    submission: sanitizeSubmission(submission),
    report,
  });
});

const publishReport = catchAsync(async (req, res) => {
  await ensurePreviousReportPublished(req.params.date);
  const report = await generateConsolidatedReport(req.params.date, req.user._id);

  await logAudit({
    action: "REPORT_PUBLICATION",
    req,
    targetId: report._id,
    targetCollection: "consolidatedReports",
    date: report.date,
    newValue: report,
    note: "Report published by admin",
  });

  res.status(200).json({
    success: true,
    message: "Report published for the requested date.",
    report,
  });
});

const rejectSubmission = catchAsync(async (req, res) => {
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "Rejection reason is required");
  }

  const submission = await findSubmission(req.params.id);

  if (submission.status !== "pending") {
    throw new ApiError(400, "Only pending submissions can be rejected");
  }
  const oldValue = sanitizeSubmission(submission);

  submission.status = "rejected";
  submission.reviewedBy = req.user._id;
  submission.reviewComment = reason.trim();
  await submission.save();
  await logAudit({
    action: "REJECT",
    req,
    targetId: submission._id,
    targetCollection: "paymentSubmissions",
    division: submission.division,
    date: submission.date,
    oldValue,
    newValue: sanitizeSubmission(submission),
    note: reason.trim(),
  });

  res.status(200).json({
    success: true,
    submission: sanitizeSubmission(submission),
  });
});

module.exports = {
  listPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  publishReport,
};
