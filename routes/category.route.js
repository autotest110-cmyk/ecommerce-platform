const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const categoryById = require('../middleware/categoryById');
const slugify = require('slugify');

/* ===============================
   CREATE CATEGORY
================================ */
router.post('/', auth, adminAuth, async (req, res) => {
  const { name } = req.body;

  let exists = await Category.findOne({ name });
  if (exists) {
    return res.status(400).json({ error: "Category exists" });
  }

  const category = new Category({
    name,
    slug: slugify(name, { lower: true }),
  });

  await category.save();
  res.json(category);
});

/* ===============================
   GET ALL
================================ */
router.get('/list', async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  
  res.json(categories);
  
});

/* ===============================
   GET SINGLE
================================ */
router.get('/:categoryId', categoryById, (req, res) => {
  res.json(req.category);
});

/* ===============================
   UPDATE
================================ */
router.put('/:categoryId', categoryById, async (req, res) => {
  const category = req.category;

  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name, { lower: true });
  }

  await category.save();
  res.json(category);
});

/* ===============================
   DELETE
================================ */
router.delete('/:categoryId', categoryById, async (req, res) => {
  await req.category.deleteOne();
  res.json({ message: "Deleted successfully" });
});

router.param("categoryId", categoryById);

module.exports = router;