export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
export const errorHandler = (error, req, res, next) => {
  console.error(error);
  if (error.name === "ValidationError") return res.status(400).json({ message: "Validation failed", errors: Object.values(error.errors).map((value) => value.message) });
  if (error.code === 11000) return res.status(409).json({ message: "A record with this value already exists" });
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ message: "Invalid or expired token" });
  res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
};
