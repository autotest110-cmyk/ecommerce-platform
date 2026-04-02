const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: String,
        price: Number,
        quantity: Number,

        /* ✅ NEW: VARIANT INFO */
        size: String,
        color: {
          name: String,
          hex: String,
        },

        image: String, // snapshot of product image
      },
    ],

    /* ✅ PAYMENT */
    paymentMethod: {
      type: String,
      enum: ["COD", "Stripe", "Razorpay"],
      default: "COD",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    paymentResult: Object,

    /* ✅ SHIPPING */
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: String, // 🔥 important for delivery
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    /* ✅ BETTER STATUS FLOW */
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);