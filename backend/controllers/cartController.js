import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const populate = (cart) => cart.populate({ path: "items.product", select: "name price image isAvailable stock options" });
const getCart = (user) => Cart.findOneAndUpdate({ user }, { $setOnInsert: { user } }, { new: true, upsert: true });
const normalizeSpecialInstructions = (value) => typeof value === "string" ? value.trim() : "";
const selected = (product, optionName) => {
  const option = product.options?.find((entry) => entry.name === optionName);
  if (optionName && !option) return null;
  return { optionName: option?.name || "", unitPrice: option ? (option.discountPrice ?? option.actualPrice) : product.price };
};

export const getUserCart = asyncHandler(async (req, res) => res.json(await populate(await getCart(req.user._id))));

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, optionName = "" } = req.body;
  const specialInstructions = normalizeSpecialInstructions(req.body.specialInstructions);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be a positive integer" });
  if (specialInstructions.length > 500) return res.status(400).json({ message: "Special instructions cannot exceed 500 characters" });

  const product = await Product.findById(productId);
  if (!product || !product.isAvailable) return res.status(404).json({ message: "Food item is unavailable" });
  const choice = selected(product, optionName);
  if (!choice) return res.status(400).json({ message: "Selected option is invalid" });

  const cart = await getCart(req.user._id);
  const item = cart.items.find((entry) => entry.product.toString() === productId && (entry.optionName || "") === choice.optionName && (entry.specialInstructions || "") === specialInstructions);
  const requestedQuantity = cart.items.filter((entry) => entry.product.toString() === productId).reduce((sum, entry) => sum + entry.quantity, 0) + quantity;
  if (product.stock > 0 && requestedQuantity > product.stock) return res.status(400).json({ message: "Requested quantity exceeds available stock" });

  if (item) item.quantity += quantity;
  else cart.items.push({ product: productId, quantity, specialInstructions, ...choice });
  await cart.save();
  res.status(201).json(await populate(cart));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { quantity, optionName = "" } = req.body;
  const specialInstructions = normalizeSpecialInstructions(req.body.specialInstructions);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be a positive integer" });
  const cart = await getCart(req.user._id);
  const item = cart.items.find((entry) => entry.product.toString() === req.params.productId && (entry.optionName || "") === optionName && (entry.specialInstructions || "") === specialInstructions);
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  item.quantity = quantity;
  await cart.save();
  res.json(await populate(cart));
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const optionName = req.query.optionName || "";
  const specialInstructions = normalizeSpecialInstructions(req.query.specialInstructions);
  const before = cart.items.length;
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId || (item.optionName || "") !== optionName || (item.specialInstructions || "") !== specialInstructions);
  if (before === cart.items.length) return res.status(404).json({ message: "Cart item not found" });
  await cart.save();
  res.json(await populate(cart));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json(cart);
});
