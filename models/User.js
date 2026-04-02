const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  fullName: String,
  address: String,
  city: String,
  postalCode: String,
  country: String,
  phone: String, // ✅ NEW
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    addresses: [addressSchema],

    avatar: {
      type: String,
    },

    /* 🔐 OTP VERIFICATION */
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpires: Date,

    isBlocked: {
      type: Boolean,
      default: false,
    },

    /* ✅ NEW: WISHLIST (important for clothing apps) */
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    history: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);