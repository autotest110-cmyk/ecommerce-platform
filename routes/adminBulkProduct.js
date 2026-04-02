const express = require("express");
const router = express.Router();
const csv = require("csvtojson");
const slugify = require("slugify");

const Product = require("../models/Product");
const Category = require("../models/Category");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");


const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

console.log("CLOUDINARY CHECK:", cloudinary);
/* ================= HELPER ================= */
const parseArray = (value) => {
  if (!value) return [];
  return value
    .toString()
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
};

/* ================= ROUTE ================= */
router.post(
  "/bulk-upload",
  auth,
  adminAuth,
  upload.fields([
    { name: "csv", maxCount: 1 },
    { name: "images", maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      console.log("📂 FILES:", req.files);

      const csvFile = req.files?.csv?.[0];
      const imageFiles = req.files?.images || [];

      if (!csvFile) {
        return res.status(400).json({ message: "CSV file is required" });
      }

      /* ================= READ CSV ================= */
      const csvData = csvFile.buffer.toString();
      const products = await csv().fromString(csvData);

      console.log("📊 TOTAL CSV ROWS:", products.length);

      /* ================= MAP IMAGES ================= */
     const imageMap = {};
console.log("TEST UPLOAD FUNCTION:", cloudinary?.uploader);
for (let file of imageFiles) {
  try {
    const key = file.originalname
      .replace(/\.[^/.]+$/, "")
      .toLowerCase();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "products",
        },
        (error, result) => {
          if (error) {
            console.error("❌ CLOUDINARY ERROR:", error); // 🔥 ADD THIS
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      stream.end(file.buffer);
    });

    console.log("✅ Uploaded:", key);

    imageMap[key] = {
      url: result.secure_url,
      public_id: result.public_id,
    };

  } catch (err) {
    console.error("❌ IMAGE UPLOAD FAILED:", file.originalname);
    console.error("❌ ERROR DETAILS:", err.message); // 🔥 ADD THIS
  }
}

      const savedProducts = [];

      /* ================= LOOP ================= */
      for (let item of products) {
        try {
          console.log("➡️ PROCESSING:", item.name);

          if (!item.name) {
            console.log("❌ Skipping row (no name):", item);
            continue;
          }

          /* ===== SAFE FIELDS ===== */
          const sizesRaw = item.sizes || item["sizes "] || "";
          const colorsRaw = item.colors || item["colors "] || "";
          const stockRaw = item.stock || item["stock "] || "";

          const sizes = parseArray(sizesRaw);
          const colors = parseArray(colorsRaw);
          const stocks = parseArray(stockRaw).map(Number);

          /* ================= CATEGORY ================= */
          let categoryName = item.category || "General";

          let categoryDoc = await Category.findOne({
            name: categoryName,
          });

          if (!categoryDoc) {
            categoryDoc = await Category.create({
              name: categoryName,
              slug: slugify(categoryName, { lower: true }),
            });
          }

          /* ================= VARIANTS ================= */
          const variants = [];

          sizes.forEach((size) => {
            colors.forEach((color, index) => {
              variants.push({
                size,
                color: {
                  name: color,
                  hex: "#000000",
                },
                stock: stocks[index] || 10,
                sku: `${item.name}-${size}-${color}`
                  .replace(/\s+/g, "")
                  .toLowerCase(),
              });
            });
          });

          /* ================= IMAGE ================= */
          const imageKey = item.image
            ? item.image.split(".")[0].toLowerCase()
            : "";

          const imageData = imageMap[imageKey] || {};

          if (!imageData.url) {
            console.log("⚠️ No image found for:", item.image);
          }

          /* ================= PRODUCT ================= */
          const product = new Product({
            name: item.name,
            slug: slugify(item.name, { lower: true }),
            description: item.description || "",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
            category: categoryDoc._id,

            isFeatured:
              item.isFeatured?.toString().toLowerCase() === "true",

            isOnSale:
              item.isOnSale?.toString().toLowerCase() === "true",

            discountPercent: Number(item.discountPercent || 0),

            photo: imageData.url || "",
            public_id: imageData.public_id || "",

            variants,
          });

          await product.save();
          savedProducts.push(product);

        } catch (innerErr) {
          console.error("❌ PRODUCT ERROR:", item.name);
          console.error(innerErr.message);
        }
      }

      /* ================= SUCCESS ================= */
      res.json({
        message: "Bulk upload successful",
        count: savedProducts.length,
      });

    } catch (err) {
      console.log("❌ BULK ERROR:");
      console.dir(err, { depth: null });

      res.status(500).json({
        message: err.message || "Bulk upload failed",
      });
    }
  }
);

module.exports = router;