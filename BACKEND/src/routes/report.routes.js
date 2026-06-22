const express = require("express");
const reportController = require("../controllers/report.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, restrictTo("admin", "report_user"));

router.get("/", reportController.listReports);
router.get("/:date", reportController.getReportByDate);
router.get("/:date/export/pdf", reportController.exportReportPdf);
router.get("/:date/export/excel", reportController.exportReportExcel);

module.exports = router;
