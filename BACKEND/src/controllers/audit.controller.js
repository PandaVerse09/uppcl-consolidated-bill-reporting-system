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
  const query = { ...req.query, ...req.body };

  if (query.action) filter.action = query.action.toUpperCase();
  if (query.user) filter.performedBy = query.user;
  if (query.role) filter.performerRole = query.role;
  if (query.division) filter.division = query.division;
  if (query.targetCollection) filter.targetCollection = query.targetCollection;

  if (query.from || query.to) {
    filter.timestamp = {};

    if (query.from) filter.timestamp.$gte = normalizeDate(query.from);
    if (query.to) filter.timestamp.$lte = endOfDay(query.to);
  }

  return filter;
}

const listAuditLogs = catchAsync(async (req, res) => {
  const query = { ...req.query, ...req.body };
  const limit = Math.min(Number(query.limit) || 100, 500);
  const page = Math.max(Number(query.page) || 1, 1);
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
