export const ADMIN_SESSION_KEY = "harmain_admin_session";

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export const CANCELLATION_REASONS = [
  ["customer_request", "Customer request"],
  ["duplicate_order", "Duplicate order"],
  ["unavailable_items", "Items unavailable"],
  ["delivery_issue", "Delivery issue"],
  ["payment_issue", "Payment issue"],
  ["other", "Other"],
];

export const REFUND_STATUSES = [
  ["not_required", "Not required"],
  ["pending", "Pending"],
  ["processing", "Processing"],
  ["completed", "Completed"],
  ["failed", "Failed"],
];

export const ORDER_FILTERS = [
  ["all", "All orders"],
  ["today", "Today"],
  ["pending", "Pending"],
  ["preparing", "Preparing"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];

export const navigationItems = [
  ["overview", "Overview"],
  ["products", "Products"],
  ["categories", "Categories"],
  ["orders", "Orders"],
  ["coupons", "Coupons"],
  ["offers", "Offers"],
  ["riders", "Delivery team"],
];

export const emptyProduct = (category = "") => ({
  name: "",
  description: "",
  price: "",
  category,
  image: "",
  stock: "0",
  tags: "",
  isAvailable: true,
  options: [],
});

export const emptyCategory = {
  name: "",
  description: "",
  image: "",
  isActive: true,
};

export const emptyRider = {
  name: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

export const emptyCoupon = {
  code: "",
  description: "",
  discountType: "percentage",
  value: "",
  minimumOrder: "0",
  maxDiscount: "",
  usageLimit: "0",
  perUserLimit: "1",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export const emptyOffer = {
  name: "",
  description: "",
  discountType: "percentage",
  value: "",
  appliesTo: "order",
  category: "",
  products: [],
  minimumOrder: "0",
  maxDiscount: "",
  priority: "0",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};
