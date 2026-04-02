const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");
const auth = require("../middleware/auth");
console.log("STRIPE TYPE 👉", typeof stripe);
router.post("/create-payment-intent", auth, async (req, res) => {
  try {
    const { amount } = req.body; // amount in dollars

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      metadata: { userId: req.user.id }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
