export const ADMIN_ROLES = ["owner", "manager", "order_staff"];

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

export const ROLE_PERMISSION_MAP = {
  owner: ["*"],
  manager: [
    "dashboard:read",
    "orders:manage",
    "menu:manage",
    "offers:manage",
    "customers:manage",
    "delivery:manage",
    "reports:read",
    "riders:manage",
  ],
  order_staff: ["dashboard:read", "orders:manage"],
};

export const normalizeAdminRole = (role, fallback = "manager") =>
  ADMIN_ROLES.includes(role) ? role : fallback;

export const getAdminRole = (user) => {
  if (!user || user.role !== "admin") return null;
  return normalizeAdminRole(user.adminRole, "owner");
};

export const getAdminPermissions = (user) => {
  const adminRole = getAdminRole(user);
  if (!adminRole) return [];
  const basePermissions = ROLE_PERMISSION_MAP[adminRole] || [];
  const customPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return [...new Set([...basePermissions, ...customPermissions])];
};

export const hasAdminPermission = (user, permission) => {
  if (!permission) return user?.role === "admin";
  const permissions = getAdminPermissions(user);
  return permissions.includes("*") || permissions.includes(permission);
};

export const adminSecurityPayload = (user) => ({
  adminRole: getAdminRole(user),
  permissions: getAdminPermissions(user),
});

export const sanitizeAdminPermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  const allowed = new Set(Object.keys(ADMIN_PERMISSION_LABELS).filter((key) => key !== "*"));
  return [...new Set(permissions.filter((permission) => allowed.has(permission)))];
};
