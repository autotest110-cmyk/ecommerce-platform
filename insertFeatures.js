const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();
//MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://trapti_db_user:wNUVWALyNIOiKCyv@cluster0.nyoppgq.mongodb.net/clothingStore?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  dbName: "clothingStore"
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));
const products = [
  {
    name: "Men Oversized Black T-Shirt",
    slug: "men-oversized-black-tshirt",
    description: "Premium cotton oversized t-shirt for casual wear.",
    price: 799,
    isOnSale: true,
    discountPercent: 10,
    quantity: 20,
    category: "64bfa123456789abcdef1232",
    photo: "/uploads/products/tshirt.jpg",
    isFeatured: true,

    variants: [
      {
        size: "M",
        color: { name: "Black", hex: "#000000" },
        stock: 10,
        sku: "TS-BLK-M"
      },
      {
        size: "L",
        color: { name: "Black", hex: "#000000" },
        stock: 10,
        sku: "TS-BLK-L"
      }
    ],

    gender: "men",
    tags: ["tshirt", "oversized"]
  },

  {
    name: "Women Floral Summer Dress",
    slug: "women-floral-summer-dress",
    description: "Lightweight floral dress perfect for summer outings.",
    price: 1299,
    isOnSale: true,
    discountPercent: 15,
    quantity: 15,
    category: "64bfa123456789abcdef1235",
    photo: "/uploads/products/dress.jpg",
    isFeatured: true,

    variants: [
      {
        size: "S",
        color: { name: "Red", hex: "#FF0000" },
        stock: 5,
        sku: "DR-RED-S"
      },
      {
        size: "M",
        color: { name: "Red", hex: "#FF0000" },
        stock: 10,
        sku: "DR-RED-M"
      }
    ],

    gender: "women",
    tags: ["dress", "summer"]
  },

  {
    name: "Men Slim Fit Blue Jeans",
    slug: "men-slim-fit-blue-jeans",
    description: "Stylish slim fit jeans for everyday wear.",
    price: 1599,
    isOnSale: false,
    discountPercent: 0,
    quantity: 25,
    category: "64bfa123456789abcdef1234",
    photo: "/uploads/products/jeans.jpg",
    isFeatured: true,

    variants: [
      {
        size: "M",
        color: { name: "Blue", hex: "#0000FF" },
        stock: 12,
        sku: "JN-BLU-M"
      },
      {
        size: "L",
        color: { name: "Blue", hex: "#0000FF" },
        stock: 13,
        sku: "JN-BLU-L"
      }
    ],

    gender: "men",
    tags: ["jeans", "denim"]
  }
];

const seedProducts = async () => {
  try {
    // 🔥 remove only featured products
    await Product.deleteMany({ isFeatured: true });

    // 🔥 insert new ones
    await Product.insertMany(products);

    console.log("🔥 Clothing featured products seeded!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
seedProducts();
