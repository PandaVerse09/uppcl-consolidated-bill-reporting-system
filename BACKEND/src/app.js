const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const fs = require("fs");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const auditRoutes = require("./routes/audit.routes");
const errorMiddleware = require("./middleware/error.middleware");
const ApiError = require("./utils/apiError");

const app = express();

// Disable x-powered-by header at the app level
app.disable("x-powered-by");

// Trust the first proxy hop (Nginx / Ingress) so rate limiters / CORS can read correct IP/Host
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Configure Helmet security headers
const isLocal = process.env.RUN_ENV === "local";
app.use(
  helmet({
    frameguard: { action: "deny" },
    crossOriginOpenerPolicy: isLocal
      ? { policy: "unsafe-none" }
      : { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    dnsPrefetchControl: { allow: false },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://devops1.uppcl.org",
          ...(isLocal
            ? [
                "http://localhost:5173",
                "http://localhost:5000",
                "ws://localhost:5173",
              ]
            : []),
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  }),
);

// Serve built frontend static assets from backend dist folder
app.use(
  express.static(path.join(__dirname, "../dist"), {
    index: false,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

// Liveness Probe: Checks if the application server is up and running.
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
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
  if (
    req.originalUrl.startsWith("/api") ||
    req.originalUrl === "/healthz" ||
    req.originalUrl === "/readyz" ||
    req.originalUrl === "/health"
  ) {
    return next();
  }

  const indexPath = path.join(__dirname, "../dist/index.html");
  fs.readFile(indexPath, "utf8", (err, html) => {
    if (err) {
      return res
        .status(503)
        .send("Application not yet built. Please run the build script.");
    }

    // CRITICAL: index.html must never be cached anywhere in the delivery chain.
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    // Permissions-Policy: restrict browser feature access
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), fullscreen=(self)",
    );

    res.send(html);
  });
});

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

app.use(errorMiddleware);

module.exports = app;
