const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { signToken, sendAuthCookie, clearAuthCookie } = require("../utils/jwt");
const { logAudit } = require("../services/audit.service");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    division: user.division,
    isActive: user.isActive,
  };
}

const register = catchAsync(async (req, res) => {
  const { name, email, password, role = "report_user", division } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();
  const allowedPublicRoles = ["uploader", "report_user"];

  if (!name || !normalizedEmail || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  if (!allowedPublicRoles.includes(role)) {
    throw new ApiError(400, "Only uploader and report user accounts can be registered here");
  }

  if (role === "uploader" && !division) {
    throw new ApiError(400, "Division is required for uploader accounts");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    role,
    division: role === "uploader" ? division : undefined,
  });

  const token = signToken({ id: user._id, role: user.role });
  sendAuthCookie(res, token);

  await logAudit({
    action: "CREATE_USER",
    req,
    performedBy: user._id,
    performerRole: user.role,
    targetId: user._id,
    targetCollection: "users",
    note: "Self registration",
  });

  res.status(201).json({
    success: true,
    user: publicUser(user),
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash +failedLoginAttempts +lockedUntil",
  );

  if (!user || !user.isActive) {
    await logAudit({
      action: "LOGIN_FAILED",
      req,
      note: `Failed login for ${email}`,
    });
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isLocked()) {
    throw new ApiError(423, "Account is temporarily locked due to failed login attempts");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await user.save({ validateBeforeSave: false });
    await logAudit({
      action: "LOGIN_FAILED",
      req,
      performedBy: user._id,
      performerRole: user.role,
      targetId: user._id,
      targetCollection: "users",
      note: "Invalid password",
    });
    throw new ApiError(401, "Invalid email or password");
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save({ validateBeforeSave: false });

  const token = signToken({ id: user._id, role: user.role });
  sendAuthCookie(res, token);
  await logAudit({
    action: "LOGIN",
    req,
    performedBy: user._id,
    performerRole: user.role,
    targetId: user._id,
    targetCollection: "users",
  });

  res.status(200).json({
    success: true,
    user: publicUser(user),
  });
});

const logout = catchAsync(async (req, res) => {
  clearAuthCookie(res);
  await logAudit({
    action: "LOGOUT",
    req,
    targetId: req.user._id,
    targetCollection: "users",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    user: publicUser(req.user),
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
