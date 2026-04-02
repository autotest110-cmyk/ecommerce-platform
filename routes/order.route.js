const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

/* ===============================
   CREATE ORDER
================================ */
router.post("/", auth, async (req, res) => {
  try {
    const order = new Order({
      user: req.user.id,
      orderItems: req.body.orderItems, // includes size/color
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      totalPrice: req.body.totalPrice,
    });

    const created = await order.save();
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: "Order creation failed" });
  }
});

/* ===============================
   GET USER ORDERS
================================ */
router.get("/myorders", auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("orderItems.product")
    .sort({ createdAt: -1 });

  res.json(orders);
});

/* ===============================
   GET ALL ORDERS (ADMIN)
================================ */
router.get("/", auth, adminAuth, async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(orders);
});

/* ===============================
   UPDATE STATUS (ADMIN)
================================ */
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);

  order.status = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save();
  res.json(order);
});

/* ===============================
   MARK AS PAID
================================ */
router.put("/:id/pay", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = req.body;

  await order.save();

  res.json(order);
});

module.exports = router;