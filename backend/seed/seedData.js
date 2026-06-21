import mongoose from "mongoose";
import dotenv from "dotenv";

import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Category.deleteMany();
    await Product.deleteMany();

    const categories = await Category.insertMany([
      { name: "Pizza" },
      { name: "Burger" },
      { name: "Drinks" },
    ]);

    const products = [
      {
        name: "Cheese Pizza",
        price: 12,
        category: categories[0]._id,
      },
      {
        name: "Beef Burger",
        price: 8,
        category: categories[1]._id,
      },
    ];

    await Product.insertMany(products);

    console.log("✅ Data Seeded Successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedData();
