const AuditLog = require("../models/auditLog.model");

function getRequestMeta(req) {
  if (!req) return {};

  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  };
}

async function logAudit({
  action,
  req = null,
  performedBy = null,
  performerRole = null,
  targetId = null,
  targetCollection = null,
  division = null,
  date = null,
  oldValue = null,
  newValue = null,
  note = null,
}) {
  try {
    const user = req?.user;

    await AuditLog.create({
      action,
      performedBy: performedBy || user?._id || null,
      performerRole: performerRole || user?.role || "system",
      targetId,
      targetCollection,
      division,
      date,
      oldValue,
      newValue,
      note,
      ...getRequestMeta(req),
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}

module.exports = {
  logAudit,
};
