import Coupon from "../models/Coupon.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  couponSummary,
  normalizeCouponCode,
  validateCoupon,
} from "../utils/couponService.js";

const requestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const numberValue = (value, label, { min = 0, integer = false } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed)))
    throw requestError(`${label} is invalid.`);
  return parsed;
};

const dateValue = (value, label, { optional = false } = {}) => {
  if (optional && (value === undefined || value === null || value === "")) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw requestError(`${label} is invalid.`);
  return parsed;
};

const couponPayload = (body) => {
  const code = normalizeCouponCode(body.code);
  if (!/^[A-Z0-9_-]{3,24}$/.test(code))
    throw requestError("Coupon code must be 3-24 letters, numbers, hyphens or underscores.");

  const discountType = body.discountType;
  if (!['percentage', 'fixed'].includes(discountType))
    throw requestError("Discount type is invalid.");

  const value = numberValue(body.value, "Discount value", { min: 0.01 });
  if (discountType === "percentage" && value > 100)
    throw requestError("Percentage discount cannot exceed 100.");

  const startsAt = dateValue(body.startsAt || new Date(), "Start date");
  const expiresAt = dateValue(body.expiresAt, "Expiry date", { optional: true });
  if (expiresAt && expiresAt <= startsAt)
    throw requestError("Expiry date must be later than the start date.");

  const maxDiscount =
    body.maxDiscount === undefined || body.maxDiscount === null || body.maxDiscount === ""
      ? null
      : numberValue(body.maxDiscount, "Maximum discount", { min: 0.01 });

  return {
    code,
    description: typeof body.description === "string" ? body.description.trim() : "",
    discountType,
    value,
    minimumOrder: numberValue(body.minimumOrder ?? 0, "Minimum order"),
    maxDiscount: discountType === "percentage" ? maxDiscount : null,
    usageLimit: numberValue(body.usageLimit ?? 0, "Usage limit", { integer: true }),
    perUserLimit: numberValue(body.perUserLimit ?? 1, "Per-user limit", { integer: true }),
    isActive: body.isActive !== false,
    startsAt,
    expiresAt,
  };
};

export const getCoupons = asyncHandler(async (_req, res) => {
  res.json(await Coupon.find().sort({ createdAt: -1 }));
});

export const getCouponAvailability = asyncHandler(async (_req, res) => {
  const now = new Date();
  const activeCount = await Coupon.countDocuments({
    isActive: true,
    startsAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    $expr: {
      $or: [
        { $eq: ["$usageLimit", 0] },
        { $lt: ["$usedCount", "$usageLimit"] },
      ],
    },
  });
  res.json({ available: activeCount > 0, count: activeCount });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(couponPayload(req.body));
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const current = await Coupon.findById(req.params.id);
  if (!current) return res.status(404).json({ message: "Coupon not found" });

  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    couponPayload({ ...current.toObject(), ...req.body }),
    { new: true, runValidators: true },
  );
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  res.json({ message: "Coupon deleted" });
});

export const validateCouponCode = asyncHandler(async (req, res) => {
  const subtotal = numberValue(req.body.subtotal, "Order total", { min: 0.01 });
  const { coupon, discount } = await validateCoupon({
    code: req.body.code,
    subtotal,
    userId: req.user._id,
  });
  res.json({
    coupon: couponSummary(coupon),
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
  });
});
