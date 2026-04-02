const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Order = require("../models/Order");

// 🔹 GET all orders (ADMIN)
router.get("/", auth, adminAuth, async (req, res) => {
  const orders = await Order.find().populate("user", "name email");
  res.json(orders);
});

// 🔹 UPDATE order status (ADMIN)
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;
  await order.save();

  res.json(order);
});

// 🔹 DELETE order (ADMIN)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: "Order deleted" });
});

module.exports = router;
