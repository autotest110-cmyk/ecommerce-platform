const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Product = require("../models/Product");

/* ===============================
   🔹 CREATE PRODUCT (CLOTHING)
================================ */
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload"); // ✅ for single product

router.post(
  "/",
  auth,
  adminAuth,
  upload.single("photo"), // ✅ Cloudinary upload
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        quantity,
        category,
        isFeatured,
      } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({
          message: "Name, price and category are required",
        });
      }

      // ✅ Cloudinary image URL + public_id
      const photo = req.file ? req.file.path : "";
      const public_id = req.file ? req.file.filename : "";

      const product = new Product({
        name,
        description,
        price,
        quantity,
        category,
        isFeatured,
        photo,        // ✅ Cloudinary URL
        public_id,    // ✅ needed for delete/update
      });

      await product.save();

      res.status(201).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Create failed" });
    }
  }
);
/* ===============================
   🔹 GET ALL PRODUCTS (ADMIN)
================================ */
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* ===============================
   🔹 GET SINGLE PRODUCT
================================ */
router.get("/:id", auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

/* ===============================
   🔹 UPDATE PRODUCT
===============================*/

router.put(
  "/:id",
  auth,
  adminAuth,
  upload.single("photo"), // ✅ Cloudinary upload
  async (req, res) => {
    try {
      console.log("BODY:", req.body);

      let product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Not found" });
      }

      const {
        name,
        description,
        price,
        quantity,
        category,
        isFeatured,
        variants,
      } = req.body;

      // ✅ Update fields
      if (name) product.name = name;
      if (description) product.description = description;
      if (price) product.price = price;
      if (quantity) product.quantity = quantity;
      if (category) product.category = category;
      if (isFeatured !== undefined) product.isFeatured = isFeatured;

      // ✅ Image update (Cloudinary)
      if (req.file) {
        // 🔥 delete old image from Cloudinary
        if (product.public_id) {
          await cloudinary.uploader.destroy(product.public_id);
        }

        // 🔥 save new image
        product.photo = req.file.path;        // ✅ Cloudinary URL
        product.public_id = req.file.filename; // ✅ new public_id
      }

      // ✅ Variants
      if (variants) {
        product.variants = JSON.parse(variants);
      }

      await product.save();

      res.json(product);
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      res.status(500).json({ message: "Update failed" });
    }
  }
);
/*=====================================
   🔹 DELETE PRODUCT
================================ */
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Product delete failed" });
  }
});

module.exports = router;