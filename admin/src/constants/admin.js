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

export const navigationItems = [
  ["overview", "Overview"],
  ["products", "Products"],
  ["categories", "Categories"],
  ["orders", "Orders"],
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
