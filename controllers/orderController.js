const Order = require("../models/Order");

exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice } = req.body;
    console.log("REQ.USER 👉", req.user);
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const order = new Order({
      orderItems,
      shippingAddress,
      totalPrice,
      user: req.user.id  // optional (auth later)
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
      console.error("ORDER SAVE ERROR 👉", error);
    res.status(500).json({ message: error.message });
  }
};
