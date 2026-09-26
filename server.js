const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: "./config/index.env",
});

const app = express();

// ========================================
// CORS - ALLOW ALL ORIGINS
// ========================================

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Also keep cors middleware
app.use(cors());

// ========================================
// BODY PARSING
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// LOGGER
// ========================================

app.use(morgan("dev"));

// ========================================
// MONGODB
// ========================================

const connectDB = require("./config/db");
connectDB();

// ========================================
// STATIC FILES
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
// GLOBAL ERROR
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