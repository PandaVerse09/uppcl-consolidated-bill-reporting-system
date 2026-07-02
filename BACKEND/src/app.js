const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const auditRoutes = require("./routes/audit.routes");
const errorMiddleware = require("./middleware/error.middleware");
const ApiError = require("./utils/apiError");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Serve built frontend static assets from backend dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// Liveness Probe: Checks if the application server is up and running.
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness Probe: Checks if the app is ready to receive traffic (DB connection active).
app.get("/readyz", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (dbState === 1) {
    res.status(200).json({
      status: "READY",
      database: "CONNECTED",
    });
  } else {
    res.status(503).json({
      status: "NOT_READY",
      database: dbState === 2 ? "CONNECTING" : "DISCONNECTED",
      readyState: dbState,
    });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/audit", auditRoutes);

// Fallback routing: Send index.html for non-API GET requests to support React Router client-side routing
app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  if (req.originalUrl.startsWith("/api") || req.originalUrl === "/healthz" || req.originalUrl === "/readyz") {
    return next();
  }
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

app.use(errorMiddleware);

module.exports = app;
