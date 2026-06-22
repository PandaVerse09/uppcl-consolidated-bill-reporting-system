const express = require("express");
const uploadController = require("../controllers/upload.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(restrictTo("uploader"), uploadController.createSubmission)
  .get(restrictTo("uploader", "admin"), uploadController.listSubmissions);

router.put("/:id", restrictTo("uploader"), uploadController.updateSubmission);

module.exports = router;
