import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import heroBannerRoutes from "./routes/heroBannerRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const clientOrigins = process.env.CLIENT_URL?.split(",").map((origin) => origin.trim()).filter(Boolean);
const corsOptions = { origin: clientOrigins?.length ? clientOrigins : true };
const io = new Server(server, { cors: { ...corsOptions, methods: ["GET", "POST"] } });

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("role isActive tokenVersion");
    if (!user || user.isActive === false || user.role !== "admin") return next(new Error("Administrator access is required"));
    if (Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)) return next(new Error("Session expired"));
    socket.data.userId = user._id.toString();
    return next();
  } catch {
    return next(new Error("Authentication required"));
  }
});

io.on("connection", (socket) => {
  socket.join("admin-orders");
});

app.set("io", io);
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/banners", heroBannerRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "API Running..." });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
