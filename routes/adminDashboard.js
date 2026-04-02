const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    const recentOrders = await Order.find()
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard data failed" });
  }
});

module.exports = router;
