
const crypto = require("crypto");
const Order = require("../models/Order");
const stripe = require("../config/stripe");
const {
  sendOrderConfirmationEmail,
} = require("../utils/orderEmail");

exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      customerDetails,
      customerEmail,
      paymentResult,
      paymentMethod,
      totalPrice,
    } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    if (!shippingAddress || !totalPrice || Number(totalPrice) <= 0) {
      return res.status(400).json({
        message: "Valid shipping address and total price are required",
      });
    }

    const isLoggedIn = Boolean(req.user?.id);

    const finalEmail =
      customerEmail ||
      customerDetails?.email ||
      shippingAddress.email ||
      req.user?.email ||
      "";

    if (!finalEmail) {
      return res.status(400).json({
        message: "Customer email is required",
      });
    }

    let verifiedPayment = null;
    let isPaid = false;
    let finalPaymentMethod = paymentMethod || "Stripe";

    // Verify Stripe payment directly with Stripe.
    if (paymentResult?.id) {
      verifiedPayment = await stripe.paymentIntents.retrieve(
        paymentResult.id
      );

      if (verifiedPayment.status !== "succeeded") {
        return res.status(400).json({
          message: "Payment has not been completed",
          paymentStatus: verifiedPayment.status,
        });
      }

      const expectedAmount = Math.round(Number(totalPrice) * 100);

      if (
        verifiedPayment.amount_received !== expectedAmount ||
        verifiedPayment.currency !== "inr"
      ) {
        return res.status(400).json({
          message: "Payment amount or currency does not match the order",
        });
      }

      isPaid = true;
      finalPaymentMethod = "Stripe";
    }

    const rawGuestToken = isLoggedIn
      ? null
      : crypto.randomBytes(32).toString("hex");

    const guestAccessTokenHash = rawGuestToken
      ? crypto
          .createHash("sha256")
          .update(rawGuestToken)
          .digest("hex")
      : null;

    const order = new Order({
      user: isLoggedIn ? req.user.id : null,
      isGuestOrder: !isLoggedIn,
      customerEmail: finalEmail,
      guestAccessTokenHash,
      orderItems,
      shippingAddress,
      paymentMethod: finalPaymentMethod,
      totalPrice: Number(totalPrice),
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
      paymentResult: verifiedPayment
        ? {
            id: verifiedPayment.id,
            status: verifiedPayment.status,
            amount_received: verifiedPayment.amount_received,
            currency: verifiedPayment.currency,
          }
        : undefined,
    });

    const savedOrder = await order.save();

    // Email failure should not undo a successfully saved order.
    try {
      await sendOrderConfirmationEmail(savedOrder);
    } catch (emailError) {
      console.error(
        "ORDER CONFIRMATION EMAIL ERROR:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
      guestAccessToken: rawGuestToken,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      message: "Order creation failed",
    });
  }
};

// Guest order details - requires the secret token.
exports.getGuestOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = req.headers["x-order-access-token"];

    if (!accessToken) {
      return res.status(401).json({
        message: "Order access token is required",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(accessToken)
      .digest("hex");

    const order = await Order.findOne({
      _id: id,
      isGuestOrder: true,
      guestAccessTokenHash: tokenHash,
    })
      .select("+guestAccessTokenHash")
      .populate("orderItems.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found or access denied",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GUEST ORDER DETAILS ERROR:", error);

    return res.status(500).json({
      message: "Could not fetch order details",
    });
  }
};
