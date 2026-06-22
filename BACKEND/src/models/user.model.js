const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "uploader", "report_user"],
      default: "report_user",
    },

    division: {
      type: String,
      trim: true,
      required: function requiredForUploader() {
        return this.role === "uploader";
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockedUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.isLocked = function isLocked() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
