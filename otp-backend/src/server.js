
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server/health checks with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Existing OTP rate limiter and route
app.use(
  "/api/otp",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api/otp", require("./routes/otp.routes"));

// NEW: reCAPTCHA verification rate limiter
app.use(
  "/api/recaptcha",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// NEW: reCAPTCHA verification route
app.use("/api/recaptcha", require("./routes/recaptcha.routes"));

async function startServer() {
  const required = [
    "MONGODB_URI",
    "OTP_HASH_SECRET",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "MSG91_AUTH_KEY",
    "MSG91_TEMPLATE_ID",
    "RECAPTCHA_SECRET_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error("Missing .env variables:", missing.join(", "));
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
