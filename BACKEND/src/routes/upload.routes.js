const express = require("express");
const uploadController = require("../controllers/upload.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/list", restrictTo("uploader", "admin"), uploadController.listSubmissions);
router.post("/", restrictTo("uploader"), uploadController.createSubmission);
router.post("/:id", restrictTo("uploader"), uploadController.updateSubmission);

module.exports = router;
