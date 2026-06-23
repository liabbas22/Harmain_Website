import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const payload = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Name, email and password are required" });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists" });
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
  res.status(201).json({ user: payload(user), token: generateToken(user._id) });
});
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: "Invalid email or password" });
  res.json({ user: payload(user), token: generateToken(user._id) });
});
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || user.role !== "admin" || !(await user.comparePassword(password))) return res.status(401).json({ message: "Invalid admin credentials" });
  res.json({ user: payload(user), token: generateToken(user._id) });
});
export const getMe = asyncHandler(async (req, res) => res.json({ user: payload(req.user) }));
