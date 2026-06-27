import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  req.user = await User.findById(decoded.userId).select("-password");
  if (!req.user) return res.status(401).json({ message: "Account no longer exists" });
  if (req.user.isActive === false)
    return res.status(403).json({ message: "This account has been blocked. Please contact support." });
  next();
});
export const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: "Insufficient permissions" });
