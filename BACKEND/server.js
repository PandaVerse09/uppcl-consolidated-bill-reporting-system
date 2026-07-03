require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 80;
const MONGO_URI = process.env.MONGO_URI;

// --- MongoDB Connection Retry Logic ---

async function connectDBWithRetry(retries = 5, delay = 5000) {
  if (!MONGO_URI) {
    console.error("Fatal Error: MONGO_URI is not configured in environment variables.");
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Connecting to MongoDB (Attempt ${attempt}/${retries})...`);
      await mongoose.connect(MONGO_URI);
      console.log("Successfully connected to MongoDB.");
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log(`Retrying connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("Failed to connect to MongoDB after maximum retry attempts.");
        throw err;
      }
    }
  }
}

// Monitor MongoDB Connection Status after initial success
mongoose.connection.on("connected", () => {
  console.log("Mongoose connection established.");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error occurred:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose connection was disconnected. Automatic reconnection will be attempted by driver.");
});

// --- Server Lifecycle & Graceful Shutdown ---

let server;
let healthServer;

function startHealthServer() {
  const express = require("express");
  const healthApp = express();
  const healthPort = process.env.HEALTH_PORT || (process.env.RUN_ENV === "local" ? 5001 : 801);

  healthApp.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      return res.status(200).json({ status: "OK", database: "CONNECTED" });
    }
    return res.status(503).json({
      status: "Service Unavailable",
      database: dbState === 2 ? "CONNECTING" : "DISCONNECTED",
      readyState: dbState,
    });
  });

  healthServer = healthApp.listen(healthPort, "0.0.0.0", () => {
    console.log(`Health check server running on port ${healthPort}`);
  });
}

async function startServer() {
  // Start listening first so that Kubernetes liveness check passes even if DB is still connecting
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Start the dedicated health server
  startHealthServer();

  // Connect to DB asynchronously with retry logic
  connectDBWithRetry().catch((err) => {
    console.error("Initial database connection failed. Server will remain running to respond to health probes, but will report as NOT ready.");
  });
}

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (healthServer) {
    try {
      healthServer.close(() => {
        console.log("Health check server closed.");
      });
    } catch (err) {
      console.error("Error closing health check server:", err.message);
    }
  }

  if (server) {
    // 1. Stop receiving new requests
    server.close(() => {
      console.log("HTTP server closed. Drained all active connections.");

      // 2. Disconnect from database cleanly
      mongoose.connection.close(false)
        .then(() => {
          console.log("MongoDB connection closed cleanly.");
          process.exit(0);
        })
        .catch((err) => {
          console.error("Error closing MongoDB connection:", err);
          process.exit(1);
        });
    });

    // 3. Force exit after timeout if connection drain takes too long (e.g., hanging sockets)
    const timeoutMs = process.env.SHUTDOWN_TIMEOUT_MS || 10000;
    setTimeout(() => {
      console.error(`Could not close active connections within ${timeoutMs}ms, forcing shutdown.`);
      process.exit(1);
    }, timeoutMs);
  } else {
    process.exit(0);
  }
}

// Handle termination signals sent by Kubernetes or OS
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
