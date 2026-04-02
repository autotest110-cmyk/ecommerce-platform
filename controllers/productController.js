const Product = require("../models/Product");

/* 🔥 Featured Products */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
};

/* 💸 Sale Products */
exports.getSaleProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isOnSale: true,
      discountPercent: { $gt: 0 },
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sale products" });
  }
};
