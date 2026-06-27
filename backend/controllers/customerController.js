import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const moneyNumber = (value) => Math.round(Number(value || 0) * 100) / 100;

const defaultLoyalty = {
  isEnabled: false,
  label: "Loyal customer discount",
  discountType: "percentage",
  value: 0,
  minimumOrder: 0,
  maxDiscount: null,
  expiresAt: null,
  note: "",
  updatedAt: null,
};

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

const notePayload = (note) => ({
  _id: note._id,
  text: note.text,
  createdBy: note.createdBy,
  createdByName: note.createdByName || "Admin",
  createdAt: note.createdAt,
});

const loyaltyPayload = (loyalty = {}) => {
  const plain = loyalty?.toObject ? loyalty.toObject() : loyalty || {};
  return {
    ...defaultLoyalty,
    ...plain,
    maxDiscount:
    plain.maxDiscount === undefined || plain.maxDiscount === null
      ? null
      : plain.maxDiscount,
  };
};

const statsPayload = (stats = {}) => ({
  totalOrders: Number(stats.totalOrders || 0),
  activeOrders: Number(stats.activeOrders || 0),
  deliveredOrders: Number(stats.deliveredOrders || 0),
  totalSpent: moneyNumber(stats.totalSpent || 0),
  averageOrderValue: stats.totalOrders
    ? moneyNumber(Number(stats.totalSpent || 0) / Number(stats.totalOrders || 1))
    : 0,
  lastOrderAt: stats.lastOrderAt || null,
});

const customerPayload = (user, stats = {}) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  isActive: user.isActive !== false,
  blockedReason: user.blockedReason || "",
  blockedAt: user.blockedAt || null,
  savedAddresses: (user.savedAddresses || []).map(addressPayload),
  customerNotes: (user.customerNotes || []).map(notePayload).reverse(),
  loyaltyDiscount: loyaltyPayload(user.loyaltyDiscount),
  stats: statsPayload(stats),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const customerStats = async (customerIds) => {
  if (!customerIds.length) return new Map();
  const rows = await Order.aggregate([
    { $match: { user: { $in: customerIds } } },
    {
      $group: {
        _id: "$user",
        totalOrders: { $sum: 1 },
        activeOrders: {
          $sum: {
            $cond: [
              { $in: ["$orderStatus", ["placed", "confirmed", "preparing", "out_for_delivery"]] },
              1,
              0,
            ],
          },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] },
        },
        totalSpent: {
          $sum: {
            $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$total", 0],
          },
        },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row]));
};

const findCustomer = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findOne({ _id: id, role: "user" }).select("-password");
};

const loyaltyPayloadFromBody = (body = {}) => {
  const discountType = body.discountType || "percentage";
  if (!["percentage", "fixed"].includes(discountType))
    return { error: "Discount type is invalid" };

  const value = Number(body.value || 0);
  const minimumOrder = Number(body.minimumOrder || 0);
  const maxDiscount =
    body.maxDiscount === undefined ||
    body.maxDiscount === null ||
    body.maxDiscount === ""
      ? null
      : Number(body.maxDiscount);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  if (body.isEnabled === true && (!Number.isFinite(value) || value <= 0))
    return { error: "Discount value must be greater than zero" };
  if (discountType === "percentage" && value > 100)
    return { error: "Percentage discount cannot exceed 100" };
  if (!Number.isFinite(minimumOrder) || minimumOrder < 0)
    return { error: "Minimum order is invalid" };
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0))
    return { error: "Maximum discount is invalid" };
  if (expiresAt && Number.isNaN(expiresAt.getTime()))
    return { error: "Expiry date is invalid" };

  return {
    loyalty: {
      isEnabled: body.isEnabled === true,
      label: cleanString(body.label) || "Loyal customer discount",
      discountType,
      value,
      minimumOrder,
      maxDiscount,
      expiresAt,
      note: cleanString(body.note),
      updatedAt: new Date(),
    },
  };
};

export const getCustomers = asyncHandler(async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 50 } = req.query;
  const query = { role: "user" };
  const text = cleanString(search);
  if (text) {
    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  if (status === "active") query.isActive = { $ne: false };
  if (status === "blocked") query.isActive = false;
  if (!["all", "active", "blocked"].includes(status))
    return res.status(400).json({ message: "Invalid customer status filter" });

  const currentPage = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);
  const [customers, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(query),
  ]);
  const stats = await customerStats(customers.map((customer) => customer._id));
  res.json({
    customers: customers.map((customer) =>
      customerPayload(customer, stats.get(customer._id.toString())),
    ),
    pagination: { page: currentPage, limit: pageSize, total },
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  const [stats, orders] = await Promise.all([
    customerStats([customer._id]),
    Order.find({ user: customer._id }).sort({ createdAt: -1 }).limit(25),
  ]);
  res.json({
    customer: customerPayload(customer, stats.get(customer._id.toString())),
    orders,
  });
});

export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  const isActive = req.body.isActive !== false;
  const reason = cleanString(req.body.reason);
  if (!isActive && reason.length < 5)
    return res.status(400).json({ message: "Block reason is required" });

  customer.isActive = isActive;
  customer.blockedReason = isActive ? "" : reason;
  customer.blockedAt = isActive ? null : new Date();
  customer.blockedBy = isActive ? null : req.user._id;
  await customer.save();

  const stats = await customerStats([customer._id]);
  res.json({ customer: customerPayload(customer, stats.get(customer._id.toString())) });
});

export const addCustomerNote = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  const text = cleanString(req.body.text);
  if (text.length < 3)
    return res.status(400).json({ message: "Note must be at least 3 characters" });
  if (text.length > 1000)
    return res.status(400).json({ message: "Note must be 1000 characters or fewer" });

  customer.customerNotes.push({
    text,
    createdBy: req.user._id,
    createdByName: req.user.name || "Admin",
  });
  await customer.save();
  res.status(201).json({ notes: customer.customerNotes.map(notePayload).reverse() });
});

export const deleteCustomerNote = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  const note = customer.customerNotes.id(req.params.noteId);
  if (!note) return res.status(404).json({ message: "Note not found" });
  customer.customerNotes.pull(note._id);
  await customer.save();
  res.json({ notes: customer.customerNotes.map(notePayload).reverse() });
});

export const updateCustomerLoyalty = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  const { loyalty, error } = loyaltyPayloadFromBody(req.body);
  if (error) return res.status(400).json({ message: error });

  customer.loyaltyDiscount = loyalty;
  await customer.save();

  const stats = await customerStats([customer._id]);
  res.json({ customer: customerPayload(customer, stats.get(customer._id.toString())) });
});
