const PaymentSubmission = require("../models/paymentSubmission.model");
const ConsolidatedReport = require("../models/consolidatedReport.model");
const ApiError = require("../utils/apiError");

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid date");
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = normalizeDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

async function generateConsolidatedReport(dateValue, generatedBy = null) {
  const date = normalizeDate(dateValue);
  const submissions = await PaymentSubmission.find({
    date: {
      $gte: date,
      $lte: endOfDay(date),
    },
    status: "approved",
  }).sort({ division: 1, updatedAt: 1 });

  const divisionMap = new Map();

  submissions.forEach((submission) => {
    const current = divisionMap.get(submission.division) || {
      division: submission.division,
      bankAmount: 0,
      gatewayAmount: 0,
      billingAmount: 0,
      total: 0,
    };

    current.bankAmount += submission.bankAmount;
    current.gatewayAmount += submission.gatewayAmount;
    current.billingAmount += submission.billingAmount;
    current.total += submission.totalAmount;

    divisionMap.set(submission.division, current);
  });

  const divisions = Array.from(divisionMap.values());
  const totals = divisions.reduce(
    (acc, division) => {
      acc.totalBank += division.bankAmount;
      acc.totalGateway += division.gatewayAmount;
      acc.totalBilling += division.billingAmount;
      acc.grandTotal += division.total;
      return acc;
    },
    {
      totalBank: 0,
      totalGateway: 0,
      totalBilling: 0,
      grandTotal: 0,
    },
  );

  return ConsolidatedReport.findOneAndUpdate(
    { date },
    {
      date,
      divisions,
      totals,
      generatedAt: new Date(),
      generatedBy,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );
}

module.exports = {
  generateConsolidatedReport,
  normalizeDate,
  endOfDay,
};
