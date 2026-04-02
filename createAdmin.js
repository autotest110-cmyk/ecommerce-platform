const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
// MongoDB Atlas connection string
//const MONGO_URI = 'mongodb+srv://trapti_db_user:wNUVWALyNIOiKCyv@cluster0.nyoppgq.mongodb.net/ecommerce?retryWrites=true&w=majority';
const MONGO_URI = 'mongodb+srv://trapti_db_user:wNUVWALyNIOiKCyv@cluster0.nyoppgq.mongodb.net/clothingStore?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  dbName: "clothingStore"
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

async function createAdmin() {
  const email = "admin@admin.com";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const admin = new User({
    name: "Super Admin",
    email,
    password: hashedPassword,
    role: "admin"
  });

  await admin.save();
  console.log("✅ Admin created successfully");
  process.exit();
}

createAdmin();