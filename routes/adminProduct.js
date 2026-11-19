
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

/* ===============================
   🔹 CREATE PRODUCT
================================ */
router.post(
  "/",
  auth,
  adminAuth,
  upload.single("photo"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        quantity,
        category,
        isFeatured,
        gender,
        variants,
      } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({
          message: "Name, price and category are required",
        });
      }

      // Validate gender
      const allowedGenders = ["men", "women", "unisex", "kids"];
      const productGender = gender || "unisex";

      if (!allowedGenders.includes(productGender)) {
        return res.status(400).json({
          message: "Invalid gender. Use men, women, unisex or kids.",
        });
      }

      let photo = "";
      let public_id = "";

      // Upload image to Cloudinary
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          stream.end(req.file.buffer);
        });

        photo = result.secure_url;
        public_id = result.public_id;
      }

      const product = new Product({
        name,
        description,
        price,
        quantity,
        category,
        isFeatured:
          isFeatured === "true" || isFeatured === true,
        gender: productGender,
        photo,
        public_id,
        variants: variants ? JSON.parse(variants) : [],
      });

      await product.save();

      res.status(201).json(product);
    } catch (err) {
      console.error("CREATE ERROR:", err);
      res.status(500).json({
        message: "Create failed",
      });
    }
  }
);

/* ===============================
   🔹 GET ALL PRODUCTS
================================ */
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (err) {
    console.error("FETCH PRODUCTS ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

/* ===============================
   🔹 GET SINGLE PRODUCT
================================ */
router.get("/:id", auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category"
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (err) {
    console.error("FETCH PRODUCT ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

/* ===============================
   🔹 UPDATE PRODUCT
================================ */
router.put(
  "/:id",
  auth,
  adminAuth,
  upload.single("photo"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const {
        name,
        description,
        price,
        quantity,
        category,
        isFeatured,
        gender,
        variants,
      } = req.body;

      // Update basic fields
      if (name !== undefined) product.name = name;
      if (description !== undefined) {
        product.description = description;
      }
      if (price !== undefined && price !== "") {
        product.price = price;
      }
      if (quantity !== undefined && quantity !== "") {
        product.quantity = quantity;
      }
      if (category !== undefined && category !== "") {
        product.category = category;
      }

      if (isFeatured !== undefined) {
        product.isFeatured =
          isFeatured === "true" || isFeatured === true;
      }

      // Update gender
      if (gender !== undefined && gender !== "") {
        const allowedGenders = [
          "men",
          "women",
          "unisex",
          "kids",
        ];

        if (!allowedGenders.includes(gender)) {
          return res.status(400).json({
            message: "Invalid gender. Use men, women, unisex or kids.",
          });
        }

        product.gender = gender;
      }

      // Upload new image to Cloudinary
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          stream.end(req.file.buffer);
        });

        // Delete previous image after new upload succeeds
        if (product.public_id) {
          await cloudinary.uploader.destroy(product.public_id);
        }

        product.photo = result.secure_url;
        product.public_id = result.public_id;
      }

      // Update variants
      if (variants !== undefined) {
        product.variants = variants
          ? JSON.parse(variants)
          : [];
      }

      await product.save();

      res.json(product);
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      res.status(500).json({
        message: "Update failed",
      });
    }
  }
);

/* ===============================
   🔹 DELETE PRODUCT
================================ */
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (product.public_id) {
      await cloudinary.uploader.destroy(product.public_id);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({
      message: "Product delete failed",
    });
  }
});

module.exports = router;
