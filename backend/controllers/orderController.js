import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

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
const orderFilterStatuses = {
  pending: ["placed", "confirmed"],
  preparing: ["preparing", "out_for_delivery"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
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

export const checkout = asyncHandler(async (req, res) => {
  const { deliveryAddress, paymentMethod = "cash_on_delivery" } = req.body;
  if (
    !deliveryAddress?.fullName ||
    !deliveryAddress?.phone ||
    !deliveryAddress?.line1 ||
    !deliveryAddress?.city
  )
    return res
      .status(400)
      .json({ message: "Complete delivery address is required" });

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
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
    cart.items.some(({ product }) => !product || !product.isAvailable) ||
    [...requestedByProduct.values()].some(
      ({ product, quantity }) => product.stock > 0 && quantity > product.stock,
    );
  if (hasUnavailableItem)
    return res
      .status(400)
      .json({ message: "One or more items are unavailable or out of stock" });

  const items = cart.items.map(
    ({ product, quantity, optionName, specialInstructions, unitPrice }) => ({
      product: product._id,
      name: product.name,
      optionName,
      specialInstructions,
      image: product.image,
      price: unitPrice ?? product.price,
      quantity,
    }),
  );
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  if (subtotal < MINIMUM_ORDER_AMOUNT)
    return res
      .status(400)
      .json({ message: `Minimum order amount is Rs. ${MINIMUM_ORDER_AMOUNT}` });

  const deliveryFee = Number(process.env.DELIVERY_FEE || 0);
  const order = await Order.create({
    user: req.user._id,
    items,
    deliveryAddress,
    paymentMethod,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  });
  await Promise.all(
    [...requestedByProduct.values()].map(({ product, quantity }) =>
      Product.updateOne(
        { _id: product._id, stock: { $gt: 0 } },
        { $inc: { stock: -quantity } },
      ),
    ),
  );
  cart.items = [];
  await cart.save();
  await order.populate("user", "name email");
  emitOrderEvent(req, "order:created", order);
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
