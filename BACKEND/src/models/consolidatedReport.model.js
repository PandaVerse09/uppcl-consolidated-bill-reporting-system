const mongoose = require("mongoose");

const divisionBreakdownSchema = new mongoose.Schema(
  {
    division: {
      type: String,
      required: true,
      trim: true,
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

    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const consolidatedReportSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },

    divisions: {
      type: [divisionBreakdownSchema],
      default: [],
    },

    totals: {
      totalBank: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      totalGateway: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      totalBilling: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const ConsolidatedReport = mongoose.model("consolidatedReport", consolidatedReportSchema);

module.exports = ConsolidatedReport;
