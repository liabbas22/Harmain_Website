import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { claimCouponUsage } from "../utils/couponService.js";
import { calculateDeliveryCharge } from "../utils/deliverySettingsService.js";
import { couponSnapshot, loyaltySnapshot, offerBreakdownSnapshot, offerSnapshot, selectBestDiscount } from "../utils/offerService.js";
import { productAvailability } from "../utils/productAvailability.js";
import { emitStockAlert } from "../utils/stockAlerts.js";

const statuses = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];
const cancellationReasons = [
  "customer_request",
  "duplicate_order",
  "unavailable_items",
  "delivery_issue",
  "payment_issue",
  "other",
];
const refundStatuses = [
  "not_required",
  "pending",
  "processing",
  "completed",
  "failed",
];
const MINIMUM_ORDER_AMOUNT = 500;
const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || "Asia/Karachi";
const cartLineKey = ({ product, optionName = "", specialInstructions = "", addOnsKey = "" }) =>
  [
    (product?._id || product || "").toString(),
    optionName || "",
    specialInstructions || "",
    addOnsKey || "",
  ].join("::");
const orderFilterStatuses = {
  pending: ["placed", "confirmed"],
  preparing: ["preparing", "out_for_delivery"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const checkoutAddressPayload = (address = {}) => ({
  label: (cleanString(address.label) || cleanString(address.area) || "Home").slice(0, 40),
  fullName: cleanString(address.fullName),
  phone: cleanString(address.phone),
  line1: cleanString(address.line1),
  line2: cleanString(address.line2),
  city: cleanString(address.city),
  area: cleanString(address.area),
  instructions: cleanString(address.instructions).slice(0, 300),
});
const sameAddress = (left = {}, right = {}) =>
  cleanString(left.phone) === cleanString(right.phone) &&
  cleanString(left.line1).toLowerCase() === cleanString(right.line1).toLowerCase() &&
  cleanString(left.city).toLowerCase() === cleanString(right.city).toLowerCase() &&
  cleanString(left.area).toLowerCase() === cleanString(right.area).toLowerCase();
const saveCheckoutAddress = async ({ user, address, addressId }) => {
  const addresses = user.savedAddresses || [];
  const payload = checkoutAddressPayload(address);
  let target = addressId ? addresses.id(addressId) : null;
  if (!target) target = addresses.find((entry) => sameAddress(entry, payload));
  if (target) {
    const label = target.label || payload.label;
    const isDefault = target.isDefault;
    Object.assign(target, payload, { label, isDefault });
  } else {
    addresses.push({ ...payload, isDefault: addresses.length === 0 });
  }
  await user.save();
};

const datePartsInTimeZone = (date, timeZone) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );

const timeZoneOffsetMinutes = (date, timeZone) => {
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find(({ type }) => type === "timeZoneName")?.value || "GMT";
  const match = offset.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === "+" ? minutes : -minutes;
};

const zonedMidnight = ({ year, month, day }, timeZone) => {
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  return new Date(
    utcMidnight.getTime() -
      timeZoneOffsetMinutes(utcMidnight, timeZone) * 60 * 1000,
  );
};

const todayRange = () => {
  let timeZone = BUSINESS_TIME_ZONE;
  let parts;
  try {
    parts = datePartsInTimeZone(new Date(), timeZone);
  } catch {
    timeZone = "UTC";
    parts = datePartsInTimeZone(new Date(), timeZone);
  }
  const start = zonedMidnight(parts, timeZone);
  const nextUtcDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + 1),
  );
  const end = zonedMidnight(
    {
      year: nextUtcDate.getUTCFullYear(),
      month: nextUtcDate.getUTCMonth() + 1,
      day: nextUtcDate.getUTCDate(),
    },
    timeZone,
  );
  return { $gte: start, $lt: end };
};

const orderFilter = ({ status, filter = "all" }) => {
  if (status && !statuses.includes(status)) return null;
  if (filter !== "all" && filter !== "today" && !orderFilterStatuses[filter])
    return null;
  const query = status ? { orderStatus: status } : {};
  if (filter === "today") query.createdAt = todayRange();
  if (orderFilterStatuses[filter])
    query.orderStatus = { $in: orderFilterStatuses[filter] };
  return query;
};

const orderRelations = [
  { path: "user", select: "name email" },
  { path: "assignedRider", select: "name email phone isActive" },
];
const withOrderRelations = (query) => query.populate(orderRelations);
const populateOrderRelations = (order) => order.populate(orderRelations);
const emitOrderEvent = (req, event, order) =>
  req.app
    .get("io")
    ?.to("admin-orders")
    .emit(event, { order: order.toObject() });
const comboItemSnapshots = (product) =>
  product?.isComboMeal
    ? (product.comboItems || [])
        .map((comboItem) => {
          const fallbackOptionName = comboItem.product?.options?.[0]?.name || "";
          return {
            product: comboItem.product?._id || comboItem.product || null,
            name:
              comboItem.product?.name ||
              comboItem.label ||
              "Combo item",
            optionName: comboItem.optionName || fallbackOptionName,
            quantity: Math.max(1, Number(comboItem.quantity || 1)),
          };
        })
        .filter((comboItem) => comboItem.name)
    : [];
const orderItemStockQuantity = (item) => {
  const grossQuantity = Number(item.grossQuantity || 0);
  const paidQuantity = Number(item.quantity || 0);
  const freeQuantity = Number(item.freeQuantity || 0);
  const quantity = grossQuantity > 0 ? grossQuantity : paidQuantity + freeQuantity;
  return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
};
const stockProductPayload = (product) => ({
  _id: product._id.toString(),
  name: product.name,
  image: product.image || "",
  isAvailable: product.isAvailable !== false,
  stock: Number(product.stock || 0),
});
const emitStockRestoredEvent = (req, product, quantity) => {
  if (!product?._id || quantity <= 0) return;
  req.app
    .get("io")
    ?.to("admin-orders")
    .emit("stock:restored", {
      product: stockProductPayload(product),
      quantity,
    });
};
const restoreCancelledOrderStock = async (order) => {
  const stockByProduct = new Map();
  (order.items || []).forEach((item) => {
    const productId = (item.product?._id || item.product || "").toString();
    const quantity = orderItemStockQuantity(item);
    if (!productId || quantity <= 0) return;
    stockByProduct.set(productId, (stockByProduct.get(productId) || 0) + quantity);
  });
  if (!stockByProduct.size) return [];

  const stockRestoredAt = new Date();
  const claimedOrder = await Order.findOneAndUpdate(
    { _id: order._id, stockRestored: { $ne: true } },
    { $set: { stockRestored: true, stockRestoredAt } },
    { new: true },
  ).select("stockRestored stockRestoredAt");
  if (!claimedOrder) return [];

  order.stockRestored = true;
  order.stockRestoredAt = claimedOrder.stockRestoredAt || stockRestoredAt;

  const restoredProducts = await Promise.all(
    [...stockByProduct.entries()].map(async ([productId, quantity]) => {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: quantity } },
        { new: true },
      );
      if (!product) return null;
      const nextStock = Number(product.stock);
      return {
        product,
        quantity,
        previousStock: Number.isFinite(nextStock) ? nextStock - quantity : undefined,
      };
    }),
  );

  return restoredProducts.filter(Boolean);
};

export const checkout = asyncHandler(async (req, res) => {
  const {
    deliveryAddress,
    paymentMethod = "cash_on_delivery",
    couponCode = "",
    saveAddress = false,
    addressId = "",
  } = req.body;
  const addressForOrder = checkoutAddressPayload(deliveryAddress);
  if (
    !addressForOrder.fullName ||
    !addressForOrder.phone ||
    !addressForOrder.line1 ||
    !addressForOrder.city
  )
    return res
      .status(400)
      .json({ message: "Complete delivery address is required" });

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    populate: {
      path: "comboItems.product",
      select: "name options",
    },
  });
  if (!cart?.items.length)
    return res.status(400).json({ message: "Your cart is empty" });

  const requestedByProduct = new Map();
  cart.items.forEach(({ product, quantity }) => {
    if (!product) return;
    const productId = product._id.toString();
    const current = requestedByProduct.get(productId) || {
      product,
      quantity: 0,
    };
    current.quantity += quantity;
    requestedByProduct.set(productId, current);
  });
  const hasUnavailableItem =
    cart.items.some(({ product }) => {
      if (!product || !product.isAvailable || product.stock <= 0) return true;
      return !productAvailability(product).isOrderable;
    }) ||
    [...requestedByProduct.values()].some(
      ({ product, quantity }) => quantity > product.stock,
    );
  if (hasUnavailableItem)
    return res
      .status(400)
      .json({ message: "One or more items are unavailable or out of stock" });

  const baseItems = cart.items.map(
    ({
      product,
      quantity,
      optionName,
      specialInstructions,
      addOns = [],
      addOnsKey = "",
      unitPrice,
    }) => ({
      product: product._id,
      name: product.name,
      optionName,
      specialInstructions,
      addOns,
      addOnsKey,
      comboItems: comboItemSnapshots(product),
      image: product.image,
      price: unitPrice ?? product.price,
      quantity,
    }),
  );
  const paidSubtotal = baseItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const delivery = await calculateDeliveryCharge(paidSubtotal, addressForOrder);
  if (!delivery.isDeliveryEnabled)
    return res.status(400).json({
      message: delivery.message || "Delivery is currently unavailable",
    });
  const minimumOrderAmount = delivery.minimumOrder || MINIMUM_ORDER_AMOUNT;
  if (paidSubtotal < minimumOrderAmount)
    return res
      .status(400)
      .json({ message: `Minimum order amount is Rs. ${minimumOrderAmount}` });

  const discountSelection = await selectBestDiscount({ items: cart.items, subtotal: paidSubtotal, userId: req.user._id, couponCode });
  const discount = discountSelection.applied?.discount || 0;
  const couponDiscount = discountSelection.applied?.couponDiscount || 0;
  const offerDiscount = discountSelection.applied?.offerDiscount || 0;
  const customerLoyaltyDiscount =
    discountSelection.applied?.loyaltyDiscount || 0;
  const subtotal = discountSelection.subtotal ?? paidSubtotal;
  const freeQuantityByLine = new Map(
    (discountSelection.applied?.details || [])
      .filter((detail) => Number(detail.freeQuantity || 0) > 0)
      .map((detail) => [detail.lineKey, Number(detail.freeQuantity || 0)]),
  );
  const items = baseItems.map((item) => {
    const freeQuantity = freeQuantityByLine.get(cartLineKey(item)) || 0;
    return {
      ...item,
      freeQuantity,
      grossQuantity: item.quantity + freeQuantity,
    };
  });
  const deliveredByProduct = new Map();
  items.forEach((item) => {
    const id = item.product.toString();
    const current = deliveredByProduct.get(id) || {
      product: requestedByProduct.get(id).product,
      quantity: 0,
    };
    current.quantity += item.grossQuantity;
    deliveredByProduct.set(id, current);
  });
  const hasInsufficientPromoStock = [...deliveredByProduct.values()].some(
    ({ product, quantity }) => quantity > product.stock,
  );
  if (hasInsufficientPromoStock)
    return res
      .status(400)
      .json({ message: "One or more free offer items are out of stock" });

  const deliveryFee = delivery.deliveryFee;
  if (discountSelection.applied?.type === "coupon") await claimCouponUsage(discountSelection.applied.coupon);

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items,
      deliveryAddress: addressForOrder,
      paymentMethod,
      subtotal,
      coupon: discountSelection.applied?.type === "coupon"
        ? couponSnapshot(discountSelection.applied.coupon, couponDiscount)
        : undefined,
      offer: discountSelection.applied?.type === "offer" &&
        discountSelection.applied?.kind !== "loyalty"
        ? offerSnapshot(discountSelection.applied.offer, offerDiscount || discount)
        : undefined,
      loyaltyDiscount: discountSelection.applied?.loyalty
        ? loyaltySnapshot(
            discountSelection.applied.loyalty,
            customerLoyaltyDiscount,
          )
        : undefined,
      offerBreakdown: discountSelection.applied
        ? offerBreakdownSnapshot(discountSelection.applied.details)
        : [],
      discount,
      deliveryFee,
      total: Math.max(0, subtotal - discount + deliveryFee),
    });
  } catch (error) {
    if (discountSelection.applied?.type === "coupon")
      await Coupon.updateOne(
        { _id: discountSelection.applied.coupon._id, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
      );
    throw error;
  }
  const requestedProducts = [...deliveredByProduct.values()];
  const updatedProducts = await Promise.all(
    requestedProducts.map(({ product, quantity }) =>
      Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      ),
    ),
  );
  cart.items = [];
  await cart.save();
  if (saveAddress) {
    await saveCheckoutAddress({
      user: req.user,
      address: addressForOrder,
      addressId,
    });
  }
  await order.populate("user", "name email");
  emitOrderEvent(req, "order:created", order);
  updatedProducts.forEach((product, index) =>
    emitStockAlert(req, product, requestedProducts[index].product.stock),
  );
  res.status(201).json(order);
});

export const getMyOrders = asyncHandler(async (req, res) =>
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 })),
);
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await withOrderRelations(Order.findById(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  )
    return res.status(403).json({ message: "Insufficient permissions" });
  res.json(order);
});
export const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = orderFilter(req.query);
  if (!filter) return res.status(400).json({ message: "Invalid order filter" });
  const currentPage = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);
  const [orders, total] = await Promise.all([
    withOrderRelations(
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
    ),
    Order.countDocuments(filter),
  ]);
  res.json({
    orders,
    pagination: { page: currentPage, limit: pageSize, total },
  });
});
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const {
    orderStatus,
    paymentStatus,
    cancellationReason,
    cancellationNote,
    refundStatus,
    refundAmount,
    refundReference,
  } = req.body;
  if (orderStatus && !statuses.includes(orderStatus))
    return res.status(400).json({ message: "Invalid order status" });
  if (
    paymentStatus &&
    !["pending", "paid", "failed", "refunded"].includes(paymentStatus)
  )
    return res.status(400).json({ message: "Invalid payment status" });
  if (refundStatus && !refundStatuses.includes(refundStatus))
    return res.status(400).json({ message: "Invalid refund status" });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  const nextOrderStatus = orderStatus || order.orderStatus;
  const isCancelling =
    nextOrderStatus === "cancelled" && order.orderStatus !== "cancelled";
  let restoredProducts = [];

  if (order.orderStatus === "cancelled" && nextOrderStatus !== "cancelled")
    return res
      .status(400)
      .json({ message: "Cancelled orders cannot be reopened" });

  if (isCancelling && !cancellationReason)
    return res
      .status(400)
      .json({ message: "A cancellation reason is required" });
  if (
    (cancellationReason !== undefined ||
      cancellationNote !== undefined ||
      refundStatus !== undefined ||
      refundAmount !== undefined ||
      refundReference !== undefined) &&
    nextOrderStatus !== "cancelled"
  )
    return res.status(400).json({
      message: "Cancellation and refund details require a cancelled order",
    });
  if (
    cancellationReason !== undefined &&
    !cancellationReasons.includes(cancellationReason)
  )
    return res.status(400).json({ message: "Invalid cancellation reason" });
  if (
    cancellationNote !== undefined &&
    (typeof cancellationNote !== "string" ||
      cancellationNote.trim().length > 500)
  )
    return res
      .status(400)
      .json({ message: "Cancellation note must be 500 characters or fewer" });
  if (
    refundReference !== undefined &&
    (typeof refundReference !== "string" || refundReference.trim().length > 120)
  )
    return res
      .status(400)
      .json({ message: "Refund reference must be 120 characters or fewer" });
  if (
    refundAmount !== undefined &&
    (!Number.isFinite(Number(refundAmount)) || Number(refundAmount) < 0)
  )
    return res
      .status(400)
      .json({ message: "Refund amount must be a valid positive number" });

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (cancellationReason !== undefined)
    order.cancellationReason = cancellationReason;
  if (cancellationNote !== undefined)
    order.cancellationNote = cancellationNote.trim();

  if (isCancelling) {
    order.cancelledAt = new Date();
    restoredProducts = await restoreCancelledOrderStock(order);
    if (refundStatus === undefined) {
      order.refundStatus =
        order.paymentMethod === "card" ? "pending" : "not_required";
      order.refundAmount = order.paymentMethod === "card" ? order.total : 0;
    }
  }

  if (refundStatus !== undefined) {
    order.refundStatus = refundStatus;
    if (refundStatus === "not_required") {
      order.refundAmount = 0;
      order.refundReference = "";
      order.refundedAt = null;
    } else if (refundStatus === "completed") {
      order.refundAmount =
        refundAmount === undefined
          ? order.refundAmount || order.total
          : Number(refundAmount);
      order.refundedAt = new Date();
      order.paymentStatus = "refunded";
    } else if (refundAmount !== undefined) {
      order.refundAmount = Number(refundAmount);
      if (refundStatus !== "completed") order.refundedAt = null;
    }
  } else if (refundAmount !== undefined) {
    order.refundAmount = Number(refundAmount);
  }
  if (refundReference !== undefined)
    order.refundReference = refundReference.trim();

  await order.save();
  await populateOrderRelations(order);
  emitOrderEvent(req, "order:updated", order);
  restoredProducts.forEach(({ product, previousStock, quantity }) => {
    emitStockAlert(req, product, previousStock);
    emitStockRestoredEvent(req, product, quantity);
  });
  res.json(order);
});
export const assignRider = asyncHandler(async (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(req.body, "riderId"))
    return res.status(400).json({ message: "Rider selection is required" });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.orderStatus === "cancelled")
    return res
      .status(400)
      .json({ message: "Cancelled orders cannot be assigned" });

  const { riderId } = req.body;
  if (riderId) {
    if (!mongoose.isValidObjectId(riderId))
      return res.status(400).json({ message: "Invalid rider" });
    const rider = await User.findOne({
      _id: riderId,
      role: "rider",
      isActive: { $ne: false },
    });
    if (!rider)
      return res.status(404).json({ message: "Active rider not found" });
    order.assignedRider = rider._id;
    order.assignedAt = new Date();
  } else {
    order.assignedRider = null;
    order.assignedAt = null;
  }

  await order.save();
  await populateOrderRelations(order);
  emitOrderEvent(req, "order:updated", order);
  res.json(order);
});
