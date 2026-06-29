import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";

const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || "Asia/Karachi";

const money = (value) => Math.round(Number(value || 0) * 100) / 100;
const integer = (value) => Math.round(Number(value || 0));

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

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayRange = (date, timeZone) => {
  const parts = datePartsInTimeZone(date, timeZone);
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
  return { start, end };
};

const resolveRange = ({ range = "month", from, to }) => {
  let timeZone = BUSINESS_TIME_ZONE;
  try {
    datePartsInTimeZone(new Date(), timeZone);
  } catch {
    timeZone = "UTC";
  }

  const customStart = parseDate(from);
  const customEnd = parseDate(to);
  if (customStart && customEnd && customStart < customEnd) {
    return {
      key: "custom",
      label: "Custom range",
      timeZone,
      start: customStart,
      end: customEnd,
    };
  }

  const today = dayRange(new Date(), timeZone);
  const presets = {
    today: {
      label: "Today",
      start: today.start,
      end: today.end,
    },
    week: {
      label: "Last 7 days",
      start: addDays(today.end, -7),
      end: today.end,
    },
    month: {
      label: "Last 30 days",
      start: addDays(today.end, -30),
      end: today.end,
    },
    quarter: {
      label: "Last 90 days",
      start: addDays(today.end, -90),
      end: today.end,
    },
    year: {
      label: "This year",
      start: zonedMidnight(
        {
          ...datePartsInTimeZone(new Date(), timeZone),
          month: 1,
          day: 1,
        },
        timeZone,
      ),
      end: today.end,
    },
  };
  const preset = presets[range] || presets.month;
  return { key: presets[range] ? range : "month", timeZone, ...preset };
};

const reportMatch = ({ start, end }) => ({
  createdAt: { $gte: start, $lt: end },
});

const activeOrderExpression = { $ne: ["$orderStatus", "cancelled"] };
const activeMatch = (range) => ({
  ...reportMatch(range),
  orderStatus: { $ne: "cancelled" },
});

const quantityExpression = {
  $ifNull: ["$items.grossQuantity", "$items.quantity"],
};

const salesTimeline = (range, unit) => {
  const format =
    unit === "week" ? "%G-W%V" : unit === "month" ? "%Y-%m" : "%Y-%m-%d";
  return Order.aggregate([
    { $match: activeMatch(range) },
    {
      $group: {
        _id: {
          $dateToString: {
            date: "$createdAt",
            format,
            timezone: range.timeZone,
          },
        },
        orders: { $sum: 1 },
        subtotal: { $sum: "$subtotal" },
        discounts: { $sum: "$discount" },
        deliveryFees: { $sum: "$deliveryFee" },
        revenue: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        label: "$_id",
        orders: 1,
        subtotal: { $round: ["$subtotal", 2] },
        discounts: { $round: ["$discounts", 2] },
        deliveryFees: { $round: ["$deliveryFees", 2] },
        revenue: { $round: ["$revenue", 2] },
      },
    },
  ]);
};

const summaryReport = async (range) => {
  const [summary = {}] = await Order.aggregate([
    { $match: reportMatch(range) },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        activeOrders: {
          $sum: { $cond: [activeOrderExpression, 1, 0] },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] },
        },
        grossSales: {
          $sum: { $cond: [activeOrderExpression, "$subtotal", 0] },
        },
        netSales: {
          $sum: { $cond: [activeOrderExpression, "$total", 0] },
        },
        discounts: {
          $sum: { $cond: [activeOrderExpression, "$discount", 0] },
        },
        deliveryFees: {
          $sum: { $cond: [activeOrderExpression, "$deliveryFee", 0] },
        },
        refundAmount: { $sum: "$refundAmount" },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
          },
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$total", 0],
          },
        },
      },
    },
  ]);

  const activeOrders = integer(summary.activeOrders);
  return {
    totalOrders: integer(summary.totalOrders),
    activeOrders,
    deliveredOrders: integer(summary.deliveredOrders),
    cancelledOrders: integer(summary.cancelledOrders),
    grossSales: money(summary.grossSales),
    netSales: money(summary.netSales),
    discounts: money(summary.discounts),
    deliveryFees: money(summary.deliveryFees),
    refundAmount: money(summary.refundAmount),
    paidAmount: money(summary.paidAmount),
    pendingAmount: money(summary.pendingAmount),
    averageOrderValue: activeOrders
      ? money(Number(summary.netSales || 0) / activeOrders)
      : 0,
  };
};

const bestSellingItems = (range) =>
  Order.aggregate([
    { $match: activeMatch(range) },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          product: "$items.product",
          name: "$items.name",
          optionName: "$items.optionName",
        },
        quantity: { $sum: quantityExpression },
        paidQuantity: { $sum: "$items.quantity" },
        freeQuantity: { $sum: { $ifNull: ["$items.freeQuantity", 0] } },
        revenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
        orders: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        product: "$_id.product",
        name: "$_id.name",
        optionName: "$_id.optionName",
        quantity: 1,
        paidQuantity: 1,
        freeQuantity: 1,
        revenue: { $round: ["$revenue", 2] },
        orderCount: { $size: "$orders" },
      },
    },
    { $sort: { quantity: -1, revenue: -1, name: 1 } },
    { $limit: 12 },
  ]);

const paymentReport = async (range) => {
  const [byStatus, byMethod] = await Promise.all([
    Order.aggregate([
      { $match: reportMatch(range) },
      {
        $group: {
          _id: "$paymentStatus",
          orders: { $sum: 1 },
          amount: { $sum: "$total" },
          refunds: { $sum: "$refundAmount" },
        },
      },
      { $sort: { amount: -1 } },
      {
        $project: {
          _id: 0,
          status: "$_id",
          orders: 1,
          amount: { $round: ["$amount", 2] },
          refunds: { $round: ["$refunds", 2] },
        },
      },
    ]),
    Order.aggregate([
      { $match: reportMatch(range) },
      {
        $group: {
          _id: "$paymentMethod",
          orders: { $sum: 1 },
          amount: { $sum: "$total" },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$total", 0],
            },
          },
        },
      },
      { $sort: { amount: -1 } },
      {
        $project: {
          _id: 0,
          method: "$_id",
          orders: 1,
          amount: { $round: ["$amount", 2] },
          paid: { $round: ["$paid", 2] },
          pending: { $round: ["$pending", 2] },
        },
      },
    ]),
  ]);
  return { byStatus, byMethod };
};

const cancellationReport = async (range) => {
  const cancelledMatch = { ...reportMatch(range), orderStatus: "cancelled" };
  const [byReason, byRefundStatus, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: cancelledMatch },
      {
        $group: {
          _id: { $ifNull: ["$cancellationReason", "other"] },
          orders: { $sum: 1 },
          refundAmount: { $sum: "$refundAmount" },
          lostSales: { $sum: "$total" },
        },
      },
      { $sort: { orders: -1, lostSales: -1 } },
      {
        $project: {
          _id: 0,
          reason: "$_id",
          orders: 1,
          refundAmount: { $round: ["$refundAmount", 2] },
          lostSales: { $round: ["$lostSales", 2] },
        },
      },
    ]),
    Order.aggregate([
      { $match: cancelledMatch },
      {
        $group: {
          _id: "$refundStatus",
          orders: { $sum: 1 },
          amount: { $sum: "$refundAmount" },
        },
      },
      { $sort: { amount: -1 } },
      {
        $project: {
          _id: 0,
          status: "$_id",
          orders: 1,
          amount: { $round: ["$amount", 2] },
        },
      },
    ]),
    Order.find(cancelledMatch)
      .select(
        "_id user total paymentMethod paymentStatus refundStatus refundAmount cancellationReason cancellationNote cancelledAt createdAt deliveryAddress",
      )
      .populate("user", "name email")
      .sort({ cancelledAt: -1, createdAt: -1 })
      .limit(8)
      .lean(),
  ]);
  return { byReason, byRefundStatus, recentOrders };
};

const stockUsageReport = (range) =>
  Order.aggregate([
    { $match: reportMatch(range) },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          product: "$items.product",
          name: "$items.name",
          optionName: "$items.optionName",
        },
        orderedUnits: { $sum: quantityExpression },
        usedUnits: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              quantityExpression,
              0,
            ],
          },
        },
        cancelledUnits: {
          $sum: {
            $cond: [
              { $eq: ["$orderStatus", "cancelled"] },
              quantityExpression,
              0,
            ],
          },
        },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              { $multiply: ["$items.price", "$items.quantity"] },
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        product: "$_id.product",
        name: "$_id.name",
        optionName: "$_id.optionName",
        orderedUnits: 1,
        usedUnits: 1,
        cancelledUnits: 1,
        revenue: { $round: ["$revenue", 2] },
        currentStock: "$product.stock",
        isAvailable: "$product.isAvailable",
      },
    },
    { $sort: { usedUnits: -1, orderedUnits: -1, name: 1 } },
    { $limit: 20 },
  ]);

export const getReports = asyncHandler(async (req, res) => {
  const range = resolveRange(req.query);
  const [
    summary,
    dailySales,
    weeklySales,
    monthlySales,
    topItems,
    cancellations,
    payments,
    stockUsage,
  ] = await Promise.all([
    summaryReport(range),
    salesTimeline(range, "day"),
    salesTimeline(range, "week"),
    salesTimeline(range, "month"),
    bestSellingItems(range),
    cancellationReport(range),
    paymentReport(range),
    stockUsageReport(range),
  ]);

  res.json({
    range: {
      key: range.key,
      label: range.label,
      timeZone: range.timeZone,
      from: range.start.toISOString(),
      to: range.end.toISOString(),
    },
    summary,
    sales: {
      daily: dailySales,
      weekly: weeklySales,
      monthly: monthlySales,
    },
    bestSellingItems: topItems,
    cancelledOrders: cancellations,
    payments,
    stockUsage,
  });
});
