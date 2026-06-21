import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const populateCart = (cart) => cart.populate({ path: "items.product", select: "name price image isAvailable stock" });
const getCart = (userId) => Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId } }, { new: true, upsert: true });
export const getUserCart = asyncHandler(async (req, res) => res.json(await populateCart(await getCart(req.user._id))));
export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be a positive integer" });
  const product = await Product.findById(productId);
  if (!product || !product.isAvailable) return res.status(404).json({ message: "Food item is unavailable" });
  const cart = await getCart(req.user._id); const item = cart.items.find((entry) => entry.product.toString() === productId); const nextQuantity = (item?.quantity || 0) + quantity;
  if (product.stock > 0 && nextQuantity > product.stock) return res.status(400).json({ message: "Requested quantity exceeds available stock" });
  if (item) item.quantity = nextQuantity; else cart.items.push({ product: productId, quantity });
  await cart.save(); res.status(201).json(await populateCart(cart));
});
export const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body; if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be a positive integer" });
  const cart = await getCart(req.user._id); const item = cart.items.find((entry) => entry.product.toString() === req.params.productId); if (!item) return res.status(404).json({ message: "Cart item not found" });
  const product = await Product.findById(item.product); if (!product || !product.isAvailable) return res.status(400).json({ message: "Food item is unavailable" });
  if (product.stock > 0 && quantity > product.stock) return res.status(400).json({ message: "Requested quantity exceeds available stock" });
  item.quantity = quantity; await cart.save(); res.json(await populateCart(cart));
});
export const removeItem = asyncHandler(async (req, res) => { const cart = await getCart(req.user._id); const size = cart.items.length; cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId); if (size === cart.items.length) return res.status(404).json({ message: "Cart item not found" }); await cart.save(); res.json(await populateCart(cart)); });
export const clearCart = asyncHandler(async (req, res) => { const cart = await getCart(req.user._id); cart.items = []; await cart.save(); res.json(cart); });
