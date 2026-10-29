
const express = require("express");

const router = express.Router();

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

router.post("/verify", async (req, res) => {
  try {
    const token = req.body?.token;
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      console.error("RECAPTCHA_SECRET_KEY is not configured.");
      return res.status(500).json({
        success: false,
        message: "Verification service is not configured.",
      });
    }

    if (typeof token !== "string" || token.length === 0 || token.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "A valid reCAPTCHA token is required.",
      });
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });

    const googleResponse = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(8000),
    });

    if (!googleResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Could not verify reCAPTCHA right now.",
      });
    }

    const result = await googleResponse.json();

    if (result.success !== true) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA failed. Please try again.",
      });
    }

    // For v2 checkbox, Google's success result is the key check.
    // Restrict the expected hostname to your configured domains.
    const allowedHosts = (process.env.RECAPTCHA_ALLOWED_HOSTS || "localhost")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);

    const hostname = String(result.hostname || "").toLowerCase();

    if (!hostname || !allowedHosts.includes(hostname)) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA hostname did not match.",
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("reCAPTCHA verification error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Verification service is temporarily unavailable.",
    });
  }
});

module.exports = router;
