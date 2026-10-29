
const express = require("express");
const crypto = require("crypto");
const OTP = require("../models/OTP");
const admin = require("../config/firebase-admin");
const { sendSMS } = require("../services/sms.service");

const router = express.Router();

function hashOTP(phone, otp) {
  return crypto
    .createHmac("sha256", process.env.OTP_HASH_SECRET)
    .update(`${phone}:${otp}`)
    .digest("hex");
}

function validPhone(phone) {
  return typeof phone === "string" && /^\+[1-9]\d{7,14}$/.test(phone);
}

function phoneUid(phone) {
  return "phone_" + crypto.createHash("sha256").update(phone).digest("hex");
}

// MSG91 OTP Widget flow: the client submits only the widget-issued access token.
// The MSG91 Auth Key stays on this server and is never exposed to the browser.
router.post("/verify-widget-token", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const accessToken = typeof req.body.accessToken === "string" ? req.body.accessToken.trim() : "";

    if (name.length < 2 || name.length > 80 || accessToken.length < 20 || accessToken.length > 10000) {
      return res.status(400).json({ error: "Valid name and MSG91 access token required." });
    }
    if (!process.env.MSG91_AUTH_KEY) {
      return res.status(503).json({ error: "MSG91 Auth Key is not configured on the backend." });
    }

    const providerResponse = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authkey: process.env.MSG91_AUTH_KEY,
        "access-token": accessToken,
      }),
    });
    let providerResult;
    try {
      providerResult = await providerResponse.json();
    } catch {
      providerResult = null;
    }

    const responseType = String(providerResult?.type || providerResult?.status || "").toLowerCase();
    const providerSucceeded = providerResponse.ok && (
      responseType === "success" || providerResult?.success === true
    );
    if (!providerSucceeded) {
      console.warn("MSG91 widget access-token verification rejected", {
        httpStatus: providerResponse.status,
        responseType: responseType || "unknown",
      });
      return res.status(401).json({ error: "Phone verification could not be confirmed by MSG91." });
    }

    const providerData = providerResult?.data && typeof providerResult.data === "object"
      ? providerResult.data
      : providerResult;
    let rawIdentifier = providerData?.identifier || providerData?.mobile || providerData?.phone ||
      providerData?.mobile_number || providerData?.mobileNumber || providerData?.phone_number ||
      providerData?.phoneNumber || providerData?.number;

    // Some widget responses return only a success marker; after MSG91 has verified the token,
    // its JWT claims can provide the verified identifier as a fallback.
    if (typeof rawIdentifier !== "string" && typeof rawIdentifier !== "number") {
      try {
        const jwtParts = accessToken.split(".");
        if (jwtParts.length === 3) {
          const claims = JSON.parse(Buffer.from(jwtParts[1], "base64url").toString("utf8"));
          rawIdentifier = claims.identifier || claims.mobile || claims.phone || claims.mobile_number || claims.mobileNumber;
        }
      } catch {
        // The explicit provider response remains the preferred source.
      }
    }

    if (typeof rawIdentifier !== "string" && typeof rawIdentifier !== "number") {
      return res.status(401).json({ error: "MSG91 verified the token but did not return a verified phone number. Check the widget response format." });
    }

    let digits = String(rawIdentifier).replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    if (!/^\d{8,15}$/.test(digits)) {
      return res.status(401).json({ error: "MSG91 returned an invalid verified phone number." });
    }
    const phone = `+${digits}`;

    const uid = phoneUid(phone);
    let user;
    try {
      user = await admin.auth().getUser(uid);
      user = await admin.auth().updateUser(uid, { displayName: name });
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      user = await admin.auth().createUser({ uid, displayName: name });
    }

    const token = await admin.auth().createCustomToken(user.uid);
    return res.json({ token, phone: phone.replace(/\d(?=\d{4})/g, "•") });
  } catch (error) {
    console.error("MSG91 widget verification error:", error.message);
    return res.status(500).json({ error: "Secure phone login failed. Please try again." });
  }
});

router.post("/send", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (name.length < 2 || name.length > 80 || !validPhone(phone)) {
      return res.status(400).json({
        error: "Valid name and international phone number required.",
      });
    }

    const now = new Date();
    const previous = await OTP.findOne({ phone });

    if (previous?.lastSentAt && now - previous.lastSentAt < 60000) {
      return res.status(429).json({
        error: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");

    await OTP.findOneAndUpdate(
      { phone },
      {
        $set: {
          name,
          otpHash: hashOTP(phone, otp),
          expiresAt: new Date(now.getTime() + 120000),
          attempts: 0,
          lastSentAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendSMS(phone, otp);
    } catch (error) {
      console.error("MSG91 error:", error.message);
      return res.status(502).json({
        error: "SMS send failed. Check MSG91 configuration.",
      });
    }

    return res.json({ message: "OTP sent.", expiresIn: 120 });
  } catch (error) {
    console.error("Send OTP error:", error.message);
    return res.status(500).json({ error: "Unable to send OTP." });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

    if (
      name.length < 2 ||
      name.length > 80 ||
      !validPhone(phone) ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        error: "Valid name, phone and six-digit OTP required.",
      });
    }

    const record = await OTP.findOne({ phone });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        error: "OTP expired or not found. Request a new OTP.",
      });
    }

    if (record.attempts >= 5) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(429).json({
        error: "Too many attempts. Request a new OTP.",
      });
    }

    const expected = Buffer.from(record.otpHash, "hex");
    const actual = Buffer.from(hashOTP(phone, otp), "hex");

    if (
      expected.length !== actual.length ||
      !crypto.timingSafeEqual(expected, actual)
    ) {
      record.attempts += 1;
      await record.save();

      return res.status(400).json({ error: "Incorrect OTP." });
    }

    // OTP ko dobara use hone se rokne ke liye delete karo.
    await OTP.deleteOne({ _id: record._id });

    const uid = phoneUid(phone);
    let user;

    try {
      user = await admin.auth().getUser(uid);
      user = await admin.auth().updateUser(uid, { displayName: name });
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;

      user = await admin.auth().createUser({
        uid,
        displayName: name,
      });
    }

    const token = await admin.auth().createCustomToken(user.uid);

    return res.json({ token });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return res.status(500).json({ error: "OTP verification failed." });
  }
});

module.exports = router;
