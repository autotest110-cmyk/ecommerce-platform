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

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

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

    // ✅ IMPORTANT FIX HERE
    const emailSent = await sendEmail({
      to: email,
      subject: "Verify Email",
      html: `<h2>Your OTP: ${otp}</h2>`,
    });

    if (!emailSent) {
      return res.status(400).json({
        success: false,
        message: "Email not valid or OTP failed to send",
      });
    }

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
   LOGIN
================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not registered",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({
      success: true,
      message: "Login successful",
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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

/* ===============================
   ADMIN LOGIN
================================ */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied (not admin)",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user
    });

  } catch (err) {
    console.error("[ADMIN LOGIN ERROR]", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;