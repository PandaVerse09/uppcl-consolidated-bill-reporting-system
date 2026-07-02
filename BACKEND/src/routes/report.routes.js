const express = require("express");
const reportController = require("../controllers/report.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, restrictTo("admin", "report_user"));

router.post("/list", reportController.listReports);
router.post("/:date", reportController.getReportByDate);
router.post("/:date/export/pdf", reportController.exportReportPdf);
router.post("/:date/export/excel", reportController.exportReportExcel);

module.exports = router;
