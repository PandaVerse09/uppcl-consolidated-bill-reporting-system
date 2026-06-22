function errorMiddleware(error, req, res, next) {
  const isMongoConnectionError =
    error.name === "MongoServerSelectionError" ||
    error.name === "MongooseServerSelectionError" ||
    ["ETIMEOUT", "ENOTFOUND", "ECONNREFUSED"].includes(error.code);
  const statusCode = error.statusCode || (isMongoConnectionError ? 503 : 500);
  const message = isMongoConnectionError
    ? "Database connection failed. Check MongoDB Atlas/network access and try again"
    : error.isOperational
      ? error.message
      : "Internal server error";

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorMiddleware;
