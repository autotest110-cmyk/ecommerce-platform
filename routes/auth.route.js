const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const sendEmail = require("../utils/sendEmail");

/* ===============================
   GET CURRENT USER
================================ */
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

/* ===============================
   REGISTER WITH OTP
================================ */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ 1. VALIDATION
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ 2. EMAIL FORMAT CHECK
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // ✅ 3. CHECK EXISTING USER
    let user = await User.findOne({ email });

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      user = new User({
        name,
        email,
        password: hashedPassword,
      });
    }

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    user.isVerified = false;

    await user.save();

    // ✅ 4. SAFE EMAIL SEND (IMPORTANT FIX)
    try {
      await sendEmail({
        to: email,
        subject: "Verify Email",
        html: `<h2>Your OTP: ${otp}</h2>`,
      });
    } catch (error) {
      console.error("❌ EMAIL ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please check email.",
      });
    }

    // ✅ 5. SUCCESS RESPONSE
    return res.json({
      success: true,
      message: "OTP sent successfully",
      email,
    });

  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ===============================
   VERIFY OTP
================================ */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

if (!user) {
  return res.status(400).json({
    success: false,
    message: "Email not found",
  });
}

if (user.otp !== otp) {
  return res.status(400).json({
    success: false,
    message: "Invalid OTP",
  });
}

if (user.otpExpires < Date.now()) {
  return res.status(400).json({
    success: false,
    message: "OTP expired",
  });
}

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
});

/* ===============================
   LOGIN
================================ */
router.post("/login", async (req, res) => {
  try {
    console.log("👉 LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });
    console.log("👉 USER FOUND:", user);

    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      console.log("❌ User not verified");
      return res.status(403).json({ message: "Verify email first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("👉 PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("❌ Wrong password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    console.log("✅ LOGIN SUCCESS");

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses || [],
      },
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ===============================
   ADDRESS APIs
================================ */
router.post("/address", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const { _id, ...data } = req.body;

  user.addresses.push(data);
  await user.save();

  res.json(user.addresses);
});
router.get("/profile", auth, async (req, res) => {
  try {
    console.log("👉 PROFILE API HIT");

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/address", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.addresses);
});

router.delete("/address/:id", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  user.addresses = user.addresses.filter(
    a => a._id.toString() !== req.params.id
  );

  await user.save();
  res.json(user.addresses);
});
router.post("/admin-login", async (req, res) => {
     try {
   console.log("[ADMIN LOGIN] body:", req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Not an admin" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { user: { id: user._id, role: user.role } },
    process.env.JWT_SECRET,
    { expiresIn: "4h" }
  );

  res.json({ token, user });
  } catch (err) {
    console.error("[ADMIN LOGIN ERROR]", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;