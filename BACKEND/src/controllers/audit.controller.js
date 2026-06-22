const AuditLog = require("../models/auditLog.model");
const catchAsync = require("../utils/catchAsync");
const { normalizeDate, endOfDay } = require("../services/report.service");

function sanitizeAuditLog(log) {
  return {
    id: log._id,
    action: log.action,
    performedBy: log.performedBy,
    performerRole: log.performerRole,
    targetId: log.targetId,
    targetCollection: log.targetCollection,
    division: log.division,
    date: log.date,
    oldValue: log.oldValue,
    newValue: log.newValue,
    note: log.note,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.timestamp,
  };
}

function buildAuditFilter(req) {
  const filter = {};

  if (req.query.action) filter.action = req.query.action.toUpperCase();
  if (req.query.user) filter.performedBy = req.query.user;
  if (req.query.role) filter.performerRole = req.query.role;
  if (req.query.division) filter.division = req.query.division;
  if (req.query.targetCollection) filter.targetCollection = req.query.targetCollection;

  if (req.query.from || req.query.to) {
    filter.timestamp = {};

    if (req.query.from) filter.timestamp.$gte = normalizeDate(req.query.from);
    if (req.query.to) filter.timestamp.$lte = endOfDay(req.query.to);
  }

  return filter;
}

const listAuditLogs = catchAsync(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const filter = buildAuditFilter(req);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("performedBy", "name email role division")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    logs: logs.map(sanitizeAuditLog),
  });
});

module.exports = {
  listAuditLogs,
};
