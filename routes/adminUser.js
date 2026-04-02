const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");

/* ===============================
   🔹 GET ALL USERS
================================ */
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ===============================
   🔹 CREATE USER
================================ */
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, password required",
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
      isBlocked: false,
    });

    const { password: _, ...safeUser } = user.toObject();

    res.status(201).json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "User creation failed" });
  }
});

/* ===============================
   🔹 BLOCK / UNBLOCK USER
================================ */
router.put("/:id/block", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin cannot be blocked",
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"}`,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
  }
});

/* ===============================
   🔹 DELETE USER
================================ */
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin cannot be deleted",
      });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "User delete failed" });
  }
});

module.exports = router;