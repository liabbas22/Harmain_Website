import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const addressPayload = (address) => ({
  _id: address._id,
  label: address.label || "Home",
  fullName: address.fullName,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2 || "",
  city: address.city,
  area: address.area || "",
  instructions: address.instructions || "",
  isDefault: address.isDefault === true,
});

const payload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  isActive: user.isActive !== false,
  savedAddresses: (user.savedAddresses || []).map(addressPayload),
});

const riderPayload = (rider) => ({
  _id: rider._id,
  name: rider.name,
  email: rider.email,
  phone: rider.phone || "",
  isActive: rider.isActive !== false,
  createdAt: rider.createdAt,
});

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeAddress = (body = {}) => {
  const address = {
    label: cleanString(body.label) || "Home",
    fullName: cleanString(body.fullName),
    phone: cleanString(body.phone),
    line1: cleanString(body.line1),
    line2: cleanString(body.line2),
    city: cleanString(body.city),
    area: cleanString(body.area),
    instructions: cleanString(body.instructions),
    isDefault: body.isDefault === true,
  };
  if (address.label.length > 40)
    return { error: "Address label must be 40 characters or fewer" };
  if (address.fullName.length < 2) return { error: "Enter a valid full name" };
  if (!/^\+?\d[\d\s-]{8,}$/.test(address.phone))
    return { error: "Enter a valid phone number" };
  if (address.line1.length < 6) return { error: "Enter a complete address" };
  if (!address.city) return { error: "City is required" };
  if (!address.area) return { error: "Area is required" };
  if (address.instructions.length > 300)
    return { error: "Delivery instructions must be 300 characters or fewer" };
  return { address };
};

const keepSingleDefaultAddress = (user, defaultId = null) => {
  const addresses = user.savedAddresses || [];
  if (!addresses.length) return;
  let targetId = defaultId;
  if (!targetId) {
    const currentDefault = addresses.find((address) => address.isDefault);
    targetId = (currentDefault || addresses[0])._id;
  }
  addresses.forEach((address) => {
    address.isDefault = address._id.toString() === targetId.toString();
  });
};

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

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2)
      return res.status(400).json({ message: "Enter a valid full name" });
    req.user.name = name.trim();
  }
  if (phone !== undefined) {
    if (
      phone &&
      (typeof phone !== "string" || !/^\+?\d[\d\s-]{8,}$/.test(phone.trim()))
    )
      return res.status(400).json({ message: "Enter a valid phone number" });
    req.user.phone = typeof phone === "string" ? phone.trim() : "";
  }
  await req.user.save();
  res.json({ user: payload(req.user) });
});

export const addAddress = asyncHandler(async (req, res) => {
  const { address, error } = normalizeAddress(req.body);
  if (error) return res.status(400).json({ message: error });

  address.isDefault =
    address.isDefault || !(req.user.savedAddresses || []).length;
  req.user.savedAddresses.push(address);
  if (address.isDefault) {
    const latest = req.user.savedAddresses[req.user.savedAddresses.length - 1];
    keepSingleDefaultAddress(req.user, latest._id);
  } else {
    keepSingleDefaultAddress(req.user);
  }
  await req.user.save();
  res.status(201).json({ addresses: req.user.savedAddresses.map(addressPayload) });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const current = req.user.savedAddresses.id(req.params.addressId);
  if (!current) return res.status(404).json({ message: "Address not found" });

  const { address, error } = normalizeAddress({
    ...current.toObject(),
    ...req.body,
  });
  if (error) return res.status(400).json({ message: error });

  Object.assign(current, address);
  keepSingleDefaultAddress(
    req.user,
    address.isDefault ? current._id : undefined,
  );
  await req.user.save();
  res.json({ addresses: req.user.savedAddresses.map(addressPayload) });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const current = req.user.savedAddresses.id(req.params.addressId);
  if (!current) return res.status(404).json({ message: "Address not found" });
  const wasDefault = current.isDefault === true;
  req.user.savedAddresses.pull(current._id);
  if (wasDefault) keepSingleDefaultAddress(req.user);
  await req.user.save();
  res.json({ addresses: req.user.savedAddresses.map(addressPayload) });
});

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
