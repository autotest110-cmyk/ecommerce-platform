const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const productById = require('../middleware/productById');
const formidable = require('formidable');
const slugify = require('slugify');
const _ = require('lodash');
const fs = require('fs');

/* ================================
   📦 LIST PRODUCTS
================================ */
router.get('/list', async (req, res) => {
  let order = req.query.order || 'asc';
  let sortBy = req.query.sortBy || '_id';
  let limit = parseInt(req.query.limit) || 6;
  let page = parseInt(req.query.page) || 1;
  let category = req.query.category || "";
  let search = req.query.search || "";

  let skip = (page - 1) * limit;

  try {
    // ✅ BUILD FILTER OBJECT
    let query = {};

    if (category) {
      query.category = category; // 🔥 IMPORTANT
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    console.log("QUERY:", query);

    const products = await Product.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
});
/* ================================
   🔥 FEATURED / SALE / TRENDING / NEW
================================ */
router.get("/featured", async (req, res) => {
  const products = await Product.find({ isFeatured: true }).limit(8);
  res.json(products);
});

router.get("/sale", async (req, res) => {
  const products = await Product.find({ isOnSale: true })
    .sort({ discountPercent: -1 })
    .limit(8);
  res.json(products);
});

router.get("/trending", async (req, res) => {
  const products = await Product.find()
    .sort({ sold: -1 })
    .limit(8);
  res.json(products);
});

router.get("/new", async (req, res) => {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(8);
  res.json(products);
});

/* ================================
   📂 GET CATEGORIES
================================ */
router.get('/categories', async (req, res) => {
  const categories = await Category.find({}, '_id name');
  res.json(categories);
});

/* ================================
   🔍 SEARCH PRODUCTS
================================ */
router.get("/search", async (req, res) => {
  try {
    const query = {};

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    const products = await Product.find(query)
      .populate('category')
      .limit(20);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

/* ================================
   🎯 FILTER PRODUCTS
================================ */
router.post('/filter', async (req, res) => {
  let order = req.body.order || 'desc';
  let sortBy = req.body.sortBy || '_id';
  let limit = parseInt(req.body.limit) || 100;
  let skip = parseInt(req.body.skip) || 0;

  let findArgs = {};

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {

      if (key === 'price') {
        findArgs.price = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      }

      else if (key === 'category') {
        findArgs.category = { $in: req.body.filters[key] };
      }

      else if (key === 'gender') {
        findArgs.gender = { $in: req.body.filters[key] };
      }

      else if (key === 'size') {
        findArgs['variants.size'] = { $in: req.body.filters[key] };
      }

      else if (key === 'color') {
        findArgs['variants.color.name'] = { $in: req.body.filters[key] };
      }
    }
  }

  try {
    const products = await Product.find(findArgs)
      .populate('category')
      .sort([[sortBy, order]])
      .skip(skip)
      .limit(limit);

    res.json(products);
  } catch (err) {
    res.status(500).send('Filter failed');
  }
});

/* ================================
   🔗 RELATED PRODUCTS
================================ */
router.get('/related/:productId', productById, async (req, res) => {
  const products = await Product.find({
    _id: { $ne: req.product._id },
    category: req.product.category,
  }).limit(6);

  res.json(products);
});

/* ================================
   🔎 GET PRODUCT BY SLUG
================================ */
router.get("/slug/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category");

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

/* ================================
   ➕ CREATE PRODUCT (ADMIN)
================================ */
router.post('/', auth, adminAuth, (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Upload error' });

    const {
      name,
      description,
      price,
      category,
      quantity,
      shipping,
      variants,
      gender,
      tags
    } = fields;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    let product = new Product(fields);

    /* ✅ SLUG */
    product.slug = slugify(name, { lower: true });

    /* ✅ VARIANTS */
    if (variants) {
      product.variants = JSON.parse(variants);
    }

    /* ✅ IMAGE PATH */
    if (files.photo) {
      product.photo = `/uploads/${files.photo.newFilename}`;
    }

    try {
      await product.save();
      res.json({ message: "Product created" });
    } catch (err) {
      res.status(500).send('Create failed');
    }
  });
});

/* ================================
   📄 GET SINGLE PRODUCT
================================ */
router.get('/:productId', productById, (req, res) => {
  res.json(req.product);
});

/* ================================
   ✏️ UPDATE PRODUCT
================================ */


router.put("/:id", auth, adminAuth, async (req, res) => {
      console.log("In update API:");
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    
    try {
      if (err) {
        return res.status(400).json({ error: "Form parse error" });
      }

      let product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // ✅ DEBUG (VERY IMPORTANT)
      console.log("FIELDS RECEIVED:", fields);

      /* ================= SAFE FIELD UPDATE ================= */
      const allowedFields = [
        "name",
        "description",
        "price",
        "quantity",
        "category",
        "isFeatured",
      ];

      allowedFields.forEach((field) => {
        if (fields[field] !== undefined) {
          product[field] = fields[field];
        }
      });

      /* ================= VARIANTS ================= */
      if (fields.variants) {
        try {
          const incomingVariants = JSON.parse(fields.variants);

          if (incomingVariants.length > 0) {
            const existingMap = {};

            product.variants.forEach((v) => {
              existingMap[v.sku] = v;
            });

            product.variants = incomingVariants.map((v) => {
              const existing = existingMap[v.sku];

              return {
                size: v.size,
                color: v.color,
                sku: v.sku,
                stock: existing ? existing.stock : v.stock || 0,
              };
            });
          }
        } catch (err) {
          console.error("Variant parse error:", err);
        }
      }

      /* ================= IMAGE ================= */
      if (files.photo) {
        product.photo = `/uploads/${files.photo.newFilename}`;
      }

      const updatedProduct = await product.save();

      res.json(updatedProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Product update failed" });
    }
  });
});
/* ================================
   ❌ DELETE PRODUCT
================================ */
router.delete('/:productId', auth, adminAuth, productById, async (req, res) => {
  await req.product.deleteOne();
  res.json({ message: "Deleted successfully" });
});

/* ================================
   PARAM
================================ */
router.param("productId", productById);

module.exports = router;