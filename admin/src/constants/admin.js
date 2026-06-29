export const ADMIN_SESSION_KEY = "harmain_admin_session";

export const ADMIN_ROLE_OPTIONS = [
  ["owner", "Owner"],
  ["manager", "Manager"],
  ["order_staff", "Order Staff"],
];

export const ADMIN_PERMISSION_LABELS = {
  "*": "Full owner access",
  "dashboard:read": "Dashboard overview",
  "orders:manage": "Orders and kitchen operations",
  "menu:manage": "Menu, products and categories",
  "offers:manage": "Coupons and automatic offers",
  "customers:manage": "Customer profiles",
  "delivery:manage": "Delivery branches and zones",
  "reports:read": "Sales reports",
  "riders:manage": "Delivery team",
  "security:manage": "Admin security",
};

export const hasAdminPermission = (user, permission) => {
  if (!permission) return user?.role === "admin";
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return permissions.includes("*") || permissions.includes(permission);
};

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

export const REPORT_RANGES = [
  ["today", "Today"],
  ["week", "Last 7 days"],
  ["month", "Last 30 days"],
  ["quarter", "Last 90 days"],
  ["year", "This year"],
];

export const navigationItems = [
  ["overview", "Overview", "dashboard:read"],
  ["products", "Products", "menu:manage"],
  ["categories", "Categories", "menu:manage"],
  ["orders", "Orders", "orders:manage"],
  ["reports", "Reports", "reports:read"],
  ["customers", "Customers", "customers:manage"],
  ["coupons", "Coupons", "offers:manage"],
  ["offers", "Offers", "offers:manage"],
  ["delivery", "Delivery settings", "delivery:manage"],
  ["riders", "Delivery team", "riders:manage"],
  ["security", "Security"],
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
  isFeatured: false,
  isPopular: false,
  isComboMeal: false,
  comboItems: [],
  displayOrder: "0",
  addOns: [],
  availabilitySchedule: {
    isEnabled: false,
    days: [],
    startTime: "",
    endTime: "",
    message: "",
  },
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

export const emptyAdminUser = {
  name: "",
  email: "",
  phone: "",
  password: "",
  adminRole: "manager",
  permissions: [],
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
  dealType: "discount",
  discountType: "percentage",
  value: "",
  appliesTo: "order",
  category: "",
  products: [],
  buyQuantity: "1",
  getQuantity: "1",
  comboPrice: "",
  minimumOrder: "0",
  maxDiscount: "",
  priority: "0",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};
