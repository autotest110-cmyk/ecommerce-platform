const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const adminAuth = require("../middleware/adminAuth");

/* ===============================
   CREATE ORDER - USER OR GUEST
================================ */
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      customerEmail,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    const isLoggedIn = Boolean(req.user?.id);
    const finalEmail =
      customerEmail || shippingAddress.email || "";

    if (!isLoggedIn && !finalEmail) {
      return res.status(400).json({
        message: "Email is required for guest checkout",
      });
    }

    const order = new Order({
      user: isLoggedIn ? req.user.id : null,
      isGuestOrder: !isLoggedIn,
      customerEmail: finalEmail,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
    });

    const created = await order.save();

    return res.status(201).json(created);
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);

    return res.status(500).json({
      error: "Order creation failed",
      message: err.message,
    });
  }
});

/* ===============================
   GET USER ORDERS
================================ */
router.get("/myorders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch orders" });
  }
});

/* ===============================
   GET ALL ORDERS - ADMIN
================================ */
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch orders" });
  }
});

/* ===============================
   UPDATE STATUS - ADMIN
================================ */
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
});

module.exports = router;