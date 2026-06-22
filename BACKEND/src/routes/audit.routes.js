const express = require("express");
const auditController = require("../controllers/audit.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/", auditController.listAuditLogs);
module.exports = router;
