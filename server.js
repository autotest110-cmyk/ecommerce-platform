const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const app = express();

// Load environment variables
require("dotenv").config({
  path: "./config/index.env",
});

// ========================================
// CORS - ALLOW EVERYTHING
// ========================================
app.use(cors());

app.options("*", cors());

// ========================================
// BODY PARSING
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// MongoDB
// ========================================
const connectDB = require("./config/db");
connectDB();

// ========================================
// Logger
// ========================================
app.use(morgan("dev"));

// ========================================
// Static files
// ========================================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ========================================
// ROUTES
// ========================================

app.use("/api/user", require("./routes/auth.route"));

app.use("/api/category", require("./routes/category.route"));

app.use("/api/product", require("./routes/product.route"));

app.use("/api/orders", require("./routes/order.route"));

app.use("/api/payment", require("./routes/payment.route"));

app.use(
  "/api/admin/products",
  require("./routes/adminProduct")
);

app.use(
  "/api/admin/orders",
  require("./routes/adminOrder")
);

app.use(
  "/api/admin/users",
  require("./routes/adminUser")
);

app.use(
  "/api/admin/dashboard",
  require("./routes/adminDashboard")
);

app.use(
  "/api/admin/bulk-products",
  require("./routes/adminBulkProduct")
);

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.send("test route => home page");
});

// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    msg: "Page not founded",
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);

  res.status(500).json({
    message: err.message || "Server Error",
  });
});

// ========================================
// SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});