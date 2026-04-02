const multer = require("multer");

// CSV → memory
const csvUpload = multer({
  storage: multer.memoryStorage(),
});

// Images → Cloudinary
const imageUpload = require("./upload"); // your cloudinary upload.js

module.exports = {
  csvUpload,
  imageUpload,
};