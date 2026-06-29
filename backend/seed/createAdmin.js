import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD)
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in .env before creating an admin",
    );
  if (ADMIN_PASSWORD.length < 8)
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  await mongoose.connect(MONGO_URI);
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.adminRole = "owner";
    await user.save();
    console.log("Existing user promoted to owner admin");
  } else {
    await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
      adminRole: "owner",
    });
    console.log("Owner admin account created");
  }
  await mongoose.disconnect();
};

createAdmin().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
