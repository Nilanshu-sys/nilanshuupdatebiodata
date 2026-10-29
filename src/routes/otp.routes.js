const express = require("express");
const crypto = require("crypto");
const { randomInt } = require("crypto");
const OTP = require("../models/OTP");
const firebaseAdmin = require("../config/firebase-admin");
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

router.post("/send", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (name.length < 2 || name.length > 80 || !validPhone(phone)) {
      return res.status(400).json({ error: "Valid name and international phone number required." });
    }

    const now = new Date();
    const previous = await OTP.findOne({ phone });

    if (previous?.lastSentAt && now - previous.lastSentAt < 60_000) {
      return res.status(429).json({ error: "Please wait 60 seconds before requesting another OTP." });
    }

    const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");

    await OTP.findOneAndUpdate(
      { phone },
      {
        $set: {
          name,
          otpHash: hashOTP(phone, otp),
          expiresAt: new Date(now.getTime() + 120_000),
          attempts: 0,
          lastSentAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendSMS(phone, otp);
    } catch (smsError) {
      await OTP.deleteOne({ phone });
      console.error("SMS provider error:", smsError.message);
      return res.status(502).json({ error: "SMS send failed. Check MSG91 configuration." });
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

    if (name.length < 2 || name.length > 80 || !validPhone(phone) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: "Valid name, phone and six-digit OTP required." });
    }

    const record = await OTP.findOne({ phone });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({ error: "OTP expired or not found. Request a new OTP." });
    }

    if (record.attempts >= 5) {
      await OTP.deleteOne({ phone });
      return res.status(429).json({ error: "Too many incorrect attempts. Request a new OTP." });
    }

    const expected = Buffer.from(record.otpHash, "hex");
    const actual = Buffer.from(hashOTP(phone, otp), "hex");

    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ error: "Incorrect OTP." });
    }

    // Consume the OTP before issuing a login token.
    await OTP.deleteOne({ _id: record._id });

    const admin = firebaseAdmin;
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

    return res.json({ token });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return res.status(500).json({ error: "OTP verification failed." });
  }
});

module.exports = router;