import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const statuses = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
export const checkout = asyncHandler(async (req, res) => {
  const { deliveryAddress, paymentMethod = "cash_on_delivery" } = req.body;
  if (!deliveryAddress?.fullName || !deliveryAddress?.phone || !deliveryAddress?.line1 || !deliveryAddress?.city) return res.status(400).json({ message: "Complete delivery address is required" });
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product"); if (!cart?.items.length) return res.status(400).json({ message: "Your cart is empty" });
  if (cart.items.some(({ product, quantity }) => !product || !product.isAvailable || (product.stock > 0 && quantity > product.stock))) return res.status(400).json({ message: "One or more items are unavailable or out of stock" });
  const items = cart.items.map(({ product, quantity }) => ({ product: product._id, name: product.name, image: product.image, price: product.price, quantity })); const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0); const deliveryFee = Number(process.env.DELIVERY_FEE || 0);
  const order = await Order.create({ user: req.user._id, items, deliveryAddress, paymentMethod, subtotal, deliveryFee, total: subtotal + deliveryFee });
  await Promise.all(items.map((item) => Product.updateOne({ _id: item.product, stock: { $gt: 0 } }, { $inc: { stock: -item.quantity } }))); cart.items = []; await cart.save(); res.status(201).json(order);
});
export const getMyOrders = asyncHandler(async (req, res) => res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 })));
export const getOrderById = asyncHandler(async (req, res) => { const order = await Order.findById(req.params.id).populate("user", "name email"); if (!order) return res.status(404).json({ message: "Order not found" }); if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Insufficient permissions" }); res.json(order); });
export const getOrders = asyncHandler(async (req, res) => { const { status, page = 1, limit = 20 } = req.query; const filter = status ? { orderStatus: status } : {}; const currentPage = Math.max(Number(page), 1); const pageSize = Math.min(Math.max(Number(limit), 1), 100); const [orders, total] = await Promise.all([Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize), Order.countDocuments(filter)]); res.json({ orders, pagination: { page: currentPage, limit: pageSize, total } }); });
export const updateOrderStatus = asyncHandler(async (req, res) => { const { orderStatus, paymentStatus } = req.body; if (orderStatus && !statuses.includes(orderStatus)) return res.status(400).json({ message: "Invalid order status" }); const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: "Order not found" }); if (orderStatus) order.orderStatus = orderStatus; if (paymentStatus) order.paymentStatus = paymentStatus; await order.save(); res.json(order); });
