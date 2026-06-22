const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { logAudit } = require("../services/audit.service");

const allowedRoles = ["admin", "uploader", "report_user"];

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    division: user.division,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const listUsers = catchAsync(async (req, res) => {
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map(sanitizeUser),
  });
});

const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role, division } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  if (!allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid user role");
  }

  if (role === "uploader" && !division) {
    throw new ApiError(400, "Division is required for uploader accounts");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    role,
    division: role === "uploader" ? division : undefined,
  });
  await logAudit({
    action: "CREATE_USER",
    req,
    targetId: user._id,
    targetCollection: "users",
    newValue: sanitizeUser(user),
  });

  res.status(201).json({
    success: true,
    user: sanitizeUser(user),
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be true or false");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  await logAudit({
    action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    req,
    targetId: user._id,
    targetCollection: "users",
    newValue: sanitizeUser(user),
  });

  res.status(200).json({
    success: true,
    user: sanitizeUser(user),
  });
});

const deleteUser = catchAsync(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    throw new ApiError(400, "You cannot delete your own account while logged in");
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await logAudit({
    action: "DELETE_USER",
    req,
    targetId: user._id,
    targetCollection: "users",
    oldValue: sanitizeUser(user),
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    user: sanitizeUser(user),
  });
});

module.exports = {
  listUsers,
  createUser,
  updateUserStatus,
  deleteUser,
};
