const mongoose = require("mongoose");

const paymentSubmissionSchema = new mongoose.Schema(
  {
    division: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    bankAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    gatewayAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    billingAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "superseded"],
      default: "pending",
    },

    changeReason: {
      type: String,
      enum: ["initial_upload", "pre_publish_edit", "post_publish_change"],
      default: "initial_upload",
    },

    requiresApproval: {
      type: Boolean,
      default: true,
    },

    replacesSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "paymentSubmission",
      default: null,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    reviewComment: {
      type: String,
      trim: true,
    },

    isBackdate: {
      type: Boolean,
      default: false,
    },

    backdateJustification: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSubmissionSchema.index({ division: 1, date: 1 });
paymentSubmissionSchema.index({ status: 1, date: -1 });
paymentSubmissionSchema.index({ uploadedBy: 1, createdAt: -1 });

paymentSubmissionSchema.pre("validate", function computeTotal() {
  this.totalAmount =
    Number(this.bankAmount || 0) +
    Number(this.gatewayAmount || 0) +
    Number(this.billingAmount || 0);
});

const PaymentSubmission = mongoose.model("paymentSubmission", paymentSubmissionSchema);

module.exports = PaymentSubmission;
