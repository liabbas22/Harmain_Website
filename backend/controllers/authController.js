import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const payload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});
const riderPayload = (rider) => ({
  _id: rider._id,
  name: rider.name,
  email: rider.email,
  phone: rider.phone || "",
  isActive: rider.isActive !== false,
  createdAt: rider.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password)
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    return res
      .status(409)
      .json({ message: "An account with this email already exists" });
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });
  res.status(201).json({ user: payload(user), token: generateToken(user._id) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (
    !user ||
    user.isActive === false ||
    !(await user.comparePassword(password))
  )
    return res.status(401).json({ message: "Invalid email or password" });
  res.json({ user: payload(user), token: generateToken(user._id) });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (
    !user ||
    user.isActive === false ||
    user.role !== "admin" ||
    !(await user.comparePassword(password))
  )
    return res.status(401).json({ message: "Invalid admin credentials" });
  res.json({ user: payload(user), token: generateToken(user._id) });
});

export const getMe = asyncHandler(async (req, res) =>
  res.json({ user: payload(req.user) }),
);

export const getRiders = asyncHandler(async (_req, res) => {
  const riders = await User.find({ role: "rider" })
    .select("name email phone isActive createdAt")
    .sort({ isActive: -1, name: 1 });
  res.json(riders.map(riderPayload));
});

export const createRider = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password)
    return res
      .status(400)
      .json({ message: "Name, email, phone and password are required" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    return res
      .status(409)
      .json({ message: "An account with this email already exists" });
  const rider = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
    role: "rider",
  });
  res.status(201).json(riderPayload(rider));
});

export const updateRider = asyncHandler(async (req, res) => {
  const rider = await User.findOne({ _id: req.params.id, role: "rider" });
  if (!rider) return res.status(404).json({ message: "Rider not found" });
  const { name, phone, isActive } = req.body;
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim())
      return res.status(400).json({ message: "Rider name is required" });
    rider.name = name.trim();
  }
  if (phone !== undefined)
    rider.phone = typeof phone === "string" ? phone.trim() : "";
  if (typeof isActive === "boolean") rider.isActive = isActive;
  await rider.save();
  res.json(riderPayload(rider));
});
