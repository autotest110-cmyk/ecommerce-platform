const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
      unique: true,
    },

    /* ✅ NEW */
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },

    image: {
      type: String,
    },

    /* ✅ FOR NESTED CATEGORY */
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", CategorySchema);