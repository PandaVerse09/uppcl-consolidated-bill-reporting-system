const express = require("express");
const adminController = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.post("/pending", adminController.listPendingSubmissions);
router.post("/reports/:date/publish", adminController.publishReport);
router.post("/uploads/:id/approve", adminController.approveSubmission);
router.post("/uploads/:id/reject", adminController.rejectSubmission);
module.exports = router;
