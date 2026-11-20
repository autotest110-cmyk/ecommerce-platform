
const express = require("express");
const router = express.Router();

const stripe = require("../config/stripe");
const optionalAuth = require("../middleware/optionalAuth");

router.post("/create-payment-intent", optionalAuth, async (req, res) => {
  try {
    const { amount, customerEmail } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        message: "Valid payment amount is required",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: "inr",
      receipt_email: customerEmail || undefined,
      metadata: {
        userId: req.user?.id || "guest",
        checkoutType: req.user?.id ? "registered" : "guest",
        customerEmail: customerEmail || "",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("STRIPE ERROR:", error);

    res.status(500).json({
      message: "Payment initialization failed",
    });
  }
});

module.exports = router;
