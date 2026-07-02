const PaymentSubmission = require("../models/paymentSubmission.model");
const ConsolidatedReport = require("../models/consolidatedReport.model");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { logAudit } = require("../services/audit.service");

function normalizeDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

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

function getAmountFields(body) {
  const bankAmount = Number(body.bankAmount ?? 0);
  const gatewayAmount = Number(body.gatewayAmount ?? 0);
  const billingAmount = Number(body.billingAmount ?? 0);

  if ([bankAmount, gatewayAmount, billingAmount].some((amount) => Number.isNaN(amount))) {
    throw new ApiError(400, "Amounts must be valid numbers");
  }

  if ([bankAmount, gatewayAmount, billingAmount].some((amount) => amount < 0)) {
    throw new ApiError(400, "Amounts cannot be negative");
  }

  return {
    bankAmount,
    gatewayAmount,
    billingAmount,
  };
}

function ensureUploaderHasDivision(user) {
  if (!user.division) {
    throw new ApiError(400, "Uploader account does not have an assigned division");
  }
}

function endOfDay(value) {
  const date = normalizeDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function previousDay(value) {
  const date = normalizeDate(value);
  date.setDate(date.getDate() - 1);
  return date;
}

async function reportExistsForDate(date) {
  return ConsolidatedReport.exists({
    date: {
      $gte: date,
      $lte: endOfDay(date),
    },
  });
}

async function ensurePreviousDateExists(division, date) {
  const priorSubmission = await PaymentSubmission.exists({
    division,
    date: { $lt: date },
    status: { $ne: "rejected" },
  });

  if (!priorSubmission) return;

  const expectedDate = previousDay(date);
  const expectedEnd = endOfDay(expectedDate);
  const hasPreviousSubmission = await PaymentSubmission.exists({
    division,
    date: {
      $gte: expectedDate,
      $lte: expectedEnd,
    },
    status: { $nin: ["rejected", "superseded"] },
  });

  if (!hasPreviousSubmission) {
    throw new ApiError(400, "Previous date data is missing. Please upload the back date first.");
  }
}

async function findExistingEditableSubmission(division, date) {
  return PaymentSubmission.findOne({
    division,
    date: {
      $gte: date,
      $lte: endOfDay(date),
    },
    status: { $in: ["approved", "pending"] },
  }).sort({ requiresApproval: -1, updatedAt: -1 });
}

function buildListFilter(req) {
  const filter = {};
  const query = { ...req.query, ...req.body };

  if (req.user.role === "uploader") {
    filter.division = req.user.division;
  } else if (query.division) {
    filter.division = query.division;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.from || query.to) {
    filter.date = {};

    const from = normalizeDate(query.from);
    const to = normalizeDate(query.to);

    if (query.from && !from) {
      throw new ApiError(400, "Invalid from date");
    }

    if (query.to && !to) {
      throw new ApiError(400, "Invalid to date");
    }

    if (from) filter.date.$gte = from;
    if (to) {
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  return filter;
}

const createSubmission = catchAsync(async (req, res) => {
  ensureUploaderHasDivision(req.user);

  const date = normalizeDate(req.body.date || new Date());
  if (!date) {
    throw new ApiError(400, "A valid submission date is required");
  }

  const amounts = getAmountFields(req.body);
  await ensurePreviousDateExists(req.user.division, date);

  const isPublishedDate = Boolean(await reportExistsForDate(date));
  const existingSubmission = await findExistingEditableSubmission(req.user.division, date);

  if (!isPublishedDate && existingSubmission) {
    const oldValue = sanitizeSubmission(existingSubmission);

    existingSubmission.set({
      ...amounts,
      status: "approved",
      reviewedBy: null,
      reviewComment: undefined,
      changeReason: "pre_publish_edit",
      requiresApproval: false,
    });
    await existingSubmission.save();

    await logAudit({
      action: "UPDATE",
      req,
      targetId: existingSubmission._id,
      targetCollection: "paymentSubmissions",
      division: existingSubmission.division,
      date: existingSubmission.date,
      oldValue,
      newValue: sanitizeSubmission(existingSubmission),
      note: "Pre-publication uploader edit",
    });

    return res.status(200).json({
      success: true,
      message: "Submission updated before report publication.",
      submission: sanitizeSubmission(existingSubmission),
    });
  }

  if (isPublishedDate && existingSubmission?.status === "pending") {
    const oldValue = sanitizeSubmission(existingSubmission);

    existingSubmission.set({
      ...amounts,
      changeReason: "post_publish_change",
      requiresApproval: true,
      reviewComment: req.body.comment,
    });
    await existingSubmission.save();

    await logAudit({
      action: "UPDATE",
      req,
      targetId: existingSubmission._id,
      targetCollection: "paymentSubmissions",
      division: existingSubmission.division,
      date: existingSubmission.date,
      oldValue,
      newValue: sanitizeSubmission(existingSubmission),
      note: "Post-publication change request updated",
    });

    return res.status(200).json({
      success: true,
      message: "Change request updated and awaiting admin approval.",
      submission: sanitizeSubmission(existingSubmission),
    });
  }

  const submission = await PaymentSubmission.create({
    division: req.user.division,
    date,
    ...amounts,
    status: isPublishedDate ? "pending" : "approved",
    changeReason: isPublishedDate ? "post_publish_change" : "initial_upload",
    requiresApproval: isPublishedDate,
    replacesSubmission: isPublishedDate ? existingSubmission?._id || null : null,
    uploadedBy: req.user._id,
    isBackdate: date < normalizeDate(new Date()),
    backdateJustification: req.body.backdateJustification,
  });
  await logAudit({
    action: isPublishedDate ? "REQUEST_CHANGE" : "UPLOAD",
    req,
    targetId: submission._id,
    targetCollection: "paymentSubmissions",
    division: submission.division,
    date: submission.date,
    newValue: sanitizeSubmission(submission),
  });

  res.status(201).json({
    success: true,
    message: isPublishedDate
      ? "Report is already published for this date. Change request is awaiting admin approval."
      : "Submission saved. You can edit it until the report is published.",
    submission: sanitizeSubmission(submission),
  });
});

const updateSubmission = catchAsync(async (req, res) => {
  ensureUploaderHasDivision(req.user);

  const submission = await PaymentSubmission.findOne({
    _id: req.params.id,
    division: req.user.division,
  });

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  if (submission.status === "rejected" || submission.status === "superseded") {
    throw new ApiError(400, "Rejected or superseded submissions cannot be edited");
  }

  const date = normalizeDate(req.body.date || submission.date);
  if (!date) {
    throw new ApiError(400, "A valid submission date is required");
  }

  await ensurePreviousDateExists(req.user.division, date);

  const amounts = getAmountFields(req.body);
  const isPublishedDate = Boolean(await reportExistsForDate(date));
  const oldValue = sanitizeSubmission(submission);

  if (!isPublishedDate) {
    submission.set({
      date,
      ...amounts,
      status: "approved",
      reviewedBy: null,
      reviewComment: undefined,
      changeReason: "pre_publish_edit",
      requiresApproval: false,
    });
    await submission.save();

    await logAudit({
      action: "UPDATE",
      req,
      targetId: submission._id,
      targetCollection: "paymentSubmissions",
      division: submission.division,
      date: submission.date,
      oldValue,
      newValue: sanitizeSubmission(submission),
      note: "Pre-publication uploader edit",
    });

    return res.status(200).json({
      success: true,
      message: "Submission updated before report publication.",
      submission: sanitizeSubmission(submission),
    });
  }

  if (submission.status === "pending") {
    submission.set({
      date,
      ...amounts,
      changeReason: "post_publish_change",
      requiresApproval: true,
      reviewComment: req.body.comment,
    });
    await submission.save();

    await logAudit({
      action: "UPDATE",
      req,
      targetId: submission._id,
      targetCollection: "paymentSubmissions",
      division: submission.division,
      date: submission.date,
      oldValue,
      newValue: sanitizeSubmission(submission),
      note: "Post-publication change request updated",
    });

    return res.status(200).json({
      success: true,
      message: "Change request updated and awaiting admin approval.",
      submission: sanitizeSubmission(submission),
    });
  }

  const changeRequest = await PaymentSubmission.create({
    division: submission.division,
    date,
    ...amounts,
    status: "pending",
    uploadedBy: req.user._id,
    changeReason: "post_publish_change",
    requiresApproval: true,
    replacesSubmission: submission._id,
    isBackdate: date < normalizeDate(new Date()),
    backdateJustification: req.body.backdateJustification,
  });

  await logAudit({
    action: "REQUEST_CHANGE",
    req,
    targetId: changeRequest._id,
    targetCollection: "paymentSubmissions",
    division: changeRequest.division,
    date: changeRequest.date,
    oldValue,
    newValue: sanitizeSubmission(changeRequest),
    note: "Post-publication change requested",
  });

  res.status(202).json({
    success: true,
    message: "Report is already published for this date. Change request is awaiting admin approval.",
    submission: sanitizeSubmission(changeRequest),
  });
});

const listSubmissions = catchAsync(async (req, res) => {
  const filter = buildListFilter(req);

  const submissions = await PaymentSubmission.find(filter)
    .populate("uploadedBy", "name email role division")
    .populate("reviewedBy", "name email role")
    .sort({ date: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions: submissions.map(sanitizeSubmission),
  });
});

module.exports = {
  createSubmission,
  updateSubmission,
  listSubmissions,
};
