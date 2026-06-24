import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";

const serviceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const normalizeCouponCode = (code) =>
  typeof code === "string" ? code.trim().toUpperCase() : "";

export const couponSnapshot = (coupon, discount) => ({
  code: coupon.code,
  discountType: coupon.discountType,
  value: coupon.value,
  discount,
});

export const couponSummary = (coupon) => ({
  code: coupon.code,
  description: coupon.description,
  discountType: coupon.discountType,
  value: coupon.value,
  minimumOrder: coupon.minimumOrder,
  maxDiscount: coupon.maxDiscount,
});

export const validateCoupon = async ({ code, subtotal, userId }) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode)
    throw serviceError("Enter a coupon code to continue.");

  const orderAmount = Number(subtotal);
  if (!Number.isFinite(orderAmount) || orderAmount <= 0)
    throw serviceError("Coupon cannot be applied to an empty order.");

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) throw serviceError("This coupon code is not valid.");
  if (!coupon.isActive) throw serviceError("This coupon is currently inactive.");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now)
    throw serviceError("This coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt <= now)
    throw serviceError("This coupon has expired.");
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    throw serviceError("This coupon has reached its usage limit.");
  if (orderAmount < coupon.minimumOrder)
    throw serviceError(
      `This coupon requires a minimum order of Rs. ${coupon.minimumOrder}.`,
    );

  if (coupon.perUserLimit > 0 && userId) {
    const userUsage = await Order.countDocuments({
      user: userId,
      "coupon.code": coupon.code,
    });
    if (userUsage >= coupon.perUserLimit)
      throw serviceError("You have already used this coupon the allowed number of times.");
  }

  let discount =
    coupon.discountType === "percentage"
      ? (orderAmount * coupon.value) / 100
      : coupon.value;
  if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined)
    discount = Math.min(discount, coupon.maxDiscount);

  return {
    coupon,
    discount: Math.min(orderAmount, Math.round(discount * 100) / 100),
  };
};

export const claimCouponUsage = async (coupon) => {
  const filter = { _id: coupon._id, isActive: true };
  if (coupon.usageLimit > 0)
    filter.usedCount = { $lt: coupon.usageLimit };

  const claimed = await Coupon.findOneAndUpdate(
    filter,
    { $inc: { usedCount: 1 } },
    { new: true },
  );
  if (!claimed)
    throw serviceError("This coupon is no longer available. Please apply another code.");

  return claimed;
};
