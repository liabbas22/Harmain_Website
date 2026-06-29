import User from "../models/User.js";
import AdminActivityLog, {
  ADMIN_ACTIVITY_RETENTION_DAYS,
} from "../models/AdminActivityLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recordAdminActivity } from "../utils/adminActivity.js";
import {
  adminSecurityPayload,
  getAdminRole,
  normalizeAdminRole,
  sanitizeAdminPermissions,
} from "../utils/adminSecurity.js";
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

const payload = (user) => {
  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    isActive: user.isActive !== false,
    savedAddresses: (user.savedAddresses || []).map(addressPayload),
  };
  if (user.role === "admin") return { ...base, ...adminSecurityPayload(user) };
  return base;
};

const adminUserPayload = (admin) => ({
  id: admin._id,
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  phone: admin.phone || "",
  role: admin.role,
  adminRole: getAdminRole(admin),
  permissions: adminSecurityPayload(admin).permissions,
  customPermissions: admin.permissions || [],
  isActive: admin.isActive !== false,
  lastLoginAt: admin.lastLoginAt,
  passwordChangedAt: admin.passwordChangedAt,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
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
const strongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

const ownerCountQuery = {
  role: "admin",
  isActive: { $ne: false },
  $or: [
    { adminRole: "owner" },
    { adminRole: { $exists: false } },
    { adminRole: null },
  ],
};

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
  res.status(201).json({ user: payload(user), token: generateToken(user) });
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
  res.json({ user: payload(user), token: generateToken(user) });
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
  user.lastLoginAt = new Date();
  await user.save();
  req.user = user;
  await recordAdminActivity({
    req,
    action: "admin.login",
    entity: "auth",
    metadata: { email: user.email },
  });
  res.json({ user: payload(user), token: generateToken(user) });
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

export const getAdminUsers = asyncHandler(async (_req, res) => {
  const admins = await User.find({ role: "admin" })
    .select("name email phone role adminRole permissions isActive lastLoginAt passwordChangedAt createdAt updatedAt")
    .sort({ adminRole: 1, name: 1 });
  res.json({ admins: admins.map(adminUserPayload) });
});

export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const adminRole = normalizeAdminRole(req.body.adminRole, "manager");
  const customPermissions = sanitizeAdminPermissions(req.body.permissions);

  if (!name?.trim() || !email?.trim() || !password)
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  if (!strongPassword(password))
    return res.status(400).json({
      message: "Password must be at least 8 characters and include letters and numbers",
    });

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    return res
      .status(409)
      .json({ message: "An account with this email already exists" });

  const admin = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: cleanString(phone),
    password,
    role: "admin",
    adminRole,
    permissions: customPermissions,
  });

  await recordAdminActivity({
    req,
    action: "admin_user.create",
    entity: "admin_user",
    entityId: admin._id,
    metadata: { adminRole, email: admin.email },
  });

  res.status(201).json({ admin: adminUserPayload(admin) });
});

export const updateAdminUser = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.id, role: "admin" });
  if (!admin) return res.status(404).json({ message: "Admin user not found" });

  const isSelf = admin._id.toString() === req.user._id.toString();
  if (isSelf && (req.body.adminRole !== undefined || req.body.isActive === false))
    return res.status(400).json({
      message: "Use password/session actions for your own account. Another owner must change your role or status.",
    });

  const currentRole = getAdminRole(admin);
  const nextRole =
    req.body.adminRole !== undefined
      ? normalizeAdminRole(req.body.adminRole, currentRole)
      : currentRole;
  const nextActive =
    typeof req.body.isActive === "boolean" ? req.body.isActive : admin.isActive !== false;

  if (currentRole === "owner" && (nextRole !== "owner" || nextActive === false)) {
    const ownerCount = await User.countDocuments(ownerCountQuery);
    if (ownerCount <= 1)
      return res.status(400).json({
        message: "At least one active owner admin is required.",
      });
  }

  if (req.body.name !== undefined) {
    if (typeof req.body.name !== "string" || req.body.name.trim().length < 2)
      return res.status(400).json({ message: "Admin name is required" });
    admin.name = req.body.name.trim();
  }
  if (req.body.phone !== undefined) admin.phone = cleanString(req.body.phone);
  if (req.body.adminRole !== undefined) admin.adminRole = nextRole;
  if (typeof req.body.isActive === "boolean") admin.isActive = req.body.isActive;
  if (req.body.permissions !== undefined)
    admin.permissions = sanitizeAdminPermissions(req.body.permissions);
  if (req.body.password) {
    if (!strongPassword(req.body.password))
      return res.status(400).json({
        message: "Password must be at least 8 characters and include letters and numbers",
      });
    admin.password = req.body.password;
    admin.passwordChangedAt = new Date();
    admin.tokenVersion = Number(admin.tokenVersion || 0) + 1;
  }

  await admin.save();
  await recordAdminActivity({
    req,
    action: "admin_user.update",
    entity: "admin_user",
    entityId: admin._id,
    metadata: {
      adminRole: getAdminRole(admin),
      isActive: admin.isActive !== false,
      email: admin.email,
    },
  });

  res.json({ admin: adminUserPayload(admin) });
});

export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ message: "Current password and new password are required" });
  if (!strongPassword(newPassword))
    return res.status(400).json({
      message: "New password must be at least 8 characters and include letters and numbers",
    });

  const admin = await User.findById(req.user._id);
  if (!admin || admin.role !== "admin")
    return res.status(403).json({ message: "Administrator access is required" });
  if (!(await admin.comparePassword(currentPassword)))
    return res.status(400).json({ message: "Current password is incorrect" });

  admin.password = newPassword;
  admin.passwordChangedAt = new Date();
  admin.tokenVersion = Number(admin.tokenVersion || 0) + 1;
  await admin.save();

  req.user = admin;
  await recordAdminActivity({
    req,
    action: "admin.password_change",
    entity: "auth",
    metadata: { email: admin.email },
  });

  res.json({ user: payload(admin), token: generateToken(admin) });
});

export const logoutAdminSessions = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  if (!admin || admin.role !== "admin")
    return res.status(403).json({ message: "Administrator access is required" });

  admin.tokenVersion = Number(admin.tokenVersion || 0) + 1;
  await admin.save();

  req.user = admin;
  await recordAdminActivity({
    req,
    action: "admin.logout_all_sessions",
    entity: "auth",
    metadata: { email: admin.email },
  });

  res.json({ message: "All admin sessions have been signed out." });
});

export const getAdminActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const logs = await AdminActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ logs, retentionDays: ADMIN_ACTIVITY_RETENTION_DAYS, limit });
});
