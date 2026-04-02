const mongoose = require('mongoose');
const Product = require('./models/Product'); // path to your product model
const productData = require('./products.json'); // your JSON file
// MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://trapti_db_user:wNUVWALyNIOiKCyv@cluster0.nyoppgq.mongodb.net/clothingStore?retryWrites=true&w=majority';


//const MONGO_URI ='mongodb+srv://trapti_db_user:wNUVWALyNIOiKCyv@cluster0.nyoppgq.mongodb.net/?appName=clothingStore'
mongoose.connect(MONGO_URI, {
    dbName: "clothingStore",
})
.then(async () => {
    console.log('MongoDB connected');
console.log("✅ Connected to DB:", mongoose.connection.name);
    console.log("✅ Host:", mongoose.connection.host);
    // Insert multiple products
    const inserted = await Product.insertMany(productData);
    console.log(`${inserted.length} products inserted successfully`);
     console.log("Total products in DB:", count);


    mongoose.disconnect();
})
.catch(err => {
    console.error('Error ***', err);
});
