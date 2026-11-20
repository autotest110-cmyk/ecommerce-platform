
const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const adminAuth = require("../middleware/adminAuth");

const {
  createOrder,
  getGuestOrder,
} = require("../controllers/orderController");

// Create order - registered customer or guest
router.post("/", optionalAuth, createOrder);

// Guest order details - requires guest access token
router.get("/guest/:id", getGuestOrder);

// Registered customer orders
router.get("/myorders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Could not fetch orders",
    });
  }
});

// Admin - all orders
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Could not fetch orders",
    });
  }
});

// Admin - update order status
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({
      message: "Status update failed",
    });
  }
});

module.exports = router;
