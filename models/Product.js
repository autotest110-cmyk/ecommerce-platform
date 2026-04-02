const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    price: {
      type: Number,
      trim: true,
      required: true,
      maxlength: 32,
    },

    /* 🔥 EXISTING OFFER FIELDS (UNCHANGED) */
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },

    category: {
      type: ObjectId,
      ref: "Category",
      required: true,
    },

    /* 🔥 KEEP OLD STOCK (for backward compatibility) */
    quantity: {
      type: Number,
      default: 0,
    },

    sold: {
      type: Number,
      default: 0,
    },

    /* 🔥 KEEP OLD IMAGE */
    photo: {
      type: String,
    },

    /* ✅ NEW: MULTIPLE IMAGES */
    images: [
      {
        url: String,
        alt: String,
      },
    ],

    /* ✅ NEW: VARIANTS (SIZE + COLOR + STOCK) */
    variants: [
      {
        size: {
          type: String,
          enum: ["XS", "S", "M", "L", "XL", "XXL"],
        },
        color: {
          name: String,
          hex: String,
        },
        stock: {
          type: Number,
          default: 0,
        },
        sku: String,
      },
    ],

    /* ✅ NEW: OPTIONAL FILTER FIELDS */
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
    },

    tags: [String],

    shipping: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ✅ KEEP YOUR EXISTING LOGIC */
productSchema.virtual("finalPrice").get(function () {
  if (this.isOnSale && this.discountPercent > 0) {
    return this.price - (this.price * this.discountPercent) / 100;
  }
  return this.price;
});

/* ✅ OPTIONAL: AUTO UPDATE TOTAL QUANTITY FROM VARIANTS */
productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.quantity = this.variants.reduce(
      (acc, v) => acc + v.stock,
      0
    );
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);