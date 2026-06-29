import AdminActivityLog from "../models/AdminActivityLog.js";

export const recordAdminActivity = async ({
  req,
  action,
  entity = "system",
  entityId = "",
  metadata = {},
}) => {
  const admin = req?.user;
  if (!admin || admin.role !== "admin") return;

  try {
    await AdminActivityLog.create({
      admin: admin._id,
      adminName: admin.name || "",
      adminEmail: admin.email || "",
      action,
      entity,
      entityId: entityId ? String(entityId) : "",
      method: req.method || "",
      path: req.originalUrl || req.url || "",
      ipAddress: req.ip || req.headers?.["x-forwarded-for"] || "",
      userAgent: req.headers?.["user-agent"] || "",
      metadata,
    });
  } catch (error) {
    console.error("Admin activity log failed:", error.message);
  }
};

export const auditActivity = (action, entity, getMetadata) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400 || req.user?.role !== "admin") return;
    const metadata =
      typeof getMetadata === "function" ? getMetadata(req, res) : {};
    recordAdminActivity({
      req,
      action,
      entity,
      entityId: req.params?.id || req.params?.addressId || "",
      metadata,
    });
  });
  next();
};
