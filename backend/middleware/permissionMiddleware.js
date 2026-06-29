import { hasAdminPermission } from "../utils/adminSecurity.js";

export const requirePermission = (permission) => (req, res, next) => {
  if (hasAdminPermission(req.user, permission)) return next();
  return res.status(403).json({
    message: "You do not have permission to perform this admin action.",
  });
};
