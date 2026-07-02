const express = require("express");
const userController = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.post("/list", userController.listUsers);
router.post("/", userController.createUser);
router.post("/:id/status", userController.updateUserStatus);
router.post("/:id/delete", userController.deleteUser);

module.exports = router;
