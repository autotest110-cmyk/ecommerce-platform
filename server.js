const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
//const bodyParser = require('body-parser');

const app = express();
//app.use(bodyParser.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('dotenv').config({
  path: './config/index.env',
});

// MongoDB
const connectDB = require('./config/db');
connectDB();

app.use(morgan('dev'));
//app.use(cors());
const path = require('path');


const allowedOrigins = [
  "http://localhost:3000","http://localhost:3001",
  "https://ecommerce-frontend-gold-six.vercel.app",
  "https://shop.autotest.in",
  "https://admin1.autotest.in"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps / Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("*", cors()); // 👈 THIS LINE IS CRITICAL


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes

app.use('/api/user/', require('./routes/auth.route'));
app.use('/api/category/', require('./routes/category.route'));
app.use('/api/product/', require('./routes/product.route'));
app.use('/api/orders',  require('./routes/order.route'));
app.use('/api/payment', require('./routes/payment.route'));
app.use("/api/admin/products", require("./routes/adminProduct"));
app.use("/api/admin/orders", require("./routes/adminOrder"));
app.use("/api/admin/users", require("./routes/adminUser"));
app.use("/api/admin/dashboard", require("./routes/adminDashboard"));
app.use("/api/admin/bulk-products", require("./routes/adminBulkProduct"));

app.get('/', (req, res) => {
  res.send('test route => home page');
});

// Page Not founded
app.use((req, res) => {
  res.status(404).json({
    msg: 'Page not founded',
  });
});
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);

  res.status(500).json({
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});


