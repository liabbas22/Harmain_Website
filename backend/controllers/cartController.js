import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getComboSuggestionsForCart } from "../utils/offerService.js";
import { productAvailability } from "../utils/productAvailability.js";

const populate = (cart) =>
  cart.populate({
    path: "items.product",
    select: "name price image isAvailable stock options addOns availabilitySchedule",
  });
const getCart = (user) =>
  Cart.findOneAndUpdate(
    { user },
    { $setOnInsert: { user } },
    { new: true, upsert: true },
  );
const cartPayload = async (cart) => {
  const populatedCart = await populate(cart);
  const payload = populatedCart.toObject ? populatedCart.toObject() : populatedCart;
  return {
    ...payload,
    comboSuggestions: await getComboSuggestionsForCart(populatedCart.items || []),
  };
};
const normalizeSpecialInstructions = (value) =>
  typeof value === "string" ? value.trim() : "";
const normalizeAddOnRequest = (value) => {
  if (Array.isArray(value)) return value.map(String).map((entry) => entry.trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.map(String).map((entry) => entry.trim()).filter(Boolean);
  } catch {}
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
};
const addOnsKey = (addOns = []) =>
  addOns.map((addOn) => addOn.name.toLowerCase()).sort().join("|");
const selectedAddOns = (product, requestedAddOns = []) => {
  if (!requestedAddOns.length) return [];
  const requested = new Set(requestedAddOns.map((entry) => entry.toLowerCase()));
  const availableAddOns = product.addOns || [];
  const matches = availableAddOns
    .filter((addOn) => {
      const id = addOn._id?.toString().toLowerCase();
      const name = addOn.name?.toLowerCase();
      return addOn.isAvailable !== false && (requested.has(id) || requested.has(name));
    })
    .map((addOn) => ({ name: addOn.name, price: addOn.price }));
  if (matches.length !== requested.size) return null;
  return matches;
};
const selected = (product, optionName, requestedAddOns = []) => {
  const option = product.options?.find((entry) => entry.name === optionName);
  if (optionName && !option) return null;
  const addOns = selectedAddOns(product, requestedAddOns);
  if (!addOns) return null;
  const basePrice = option
    ? (option.discountPrice ?? option.actualPrice)
    : product.price;
  const addOnTotal = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);
  return {
    optionName: option?.name || "",
    addOns,
    addOnsKey: addOnsKey(addOns),
    unitPrice: basePrice + addOnTotal,
  };
};
const lineMatches = (entry, { productId, optionName, specialInstructions, addOnsKey }) =>
  entry.product.toString() === productId &&
  (entry.optionName || "") === optionName &&
  (entry.specialInstructions || "") === specialInstructions &&
  (entry.addOnsKey || "") === addOnsKey;

export const getUserCart = asyncHandler(async (req, res) =>
  res.json(await cartPayload(await getCart(req.user._id))),
);

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, optionName = "" } = req.body;
  const requestedAddOns = normalizeAddOnRequest(req.body.addOns);
  const specialInstructions = normalizeSpecialInstructions(
    req.body.specialInstructions,
  );
  if (!Number.isInteger(quantity) || quantity < 1)
    return res
      .status(400)
      .json({ message: "Quantity must be a positive integer" });
  if (specialInstructions.length > 500)
    return res
      .status(400)
      .json({ message: "Special instructions cannot exceed 500 characters" });

  const product = await Product.findById(productId);
  if (!product || !product.isAvailable)
    return res.status(404).json({ message: "Food item is unavailable" });
  const availability = productAvailability(product);
  if (!availability.isOrderable)
    return res
      .status(400)
      .json({ message: availability.unavailableReason || "Food item is unavailable right now" });
  if (product.stock <= 0)
    return res.status(400).json({ message: "Food item is out of stock" });
  const choice = selected(product, optionName, requestedAddOns);
  if (!choice)
    return res.status(400).json({ message: "Selected option or add-on is invalid" });

  const cart = await getCart(req.user._id);
  const item = cart.items.find(
    (entry) => lineMatches(entry, {
      productId,
      optionName: choice.optionName,
      specialInstructions,
      addOnsKey: choice.addOnsKey,
    }),
  );
  const requestedQuantity =
    cart.items
      .filter((entry) => entry.product.toString() === productId)
      .reduce((sum, entry) => sum + entry.quantity, 0) + quantity;
  if (requestedQuantity > product.stock)
    return res
      .status(400)
      .json({ message: "Requested quantity exceeds available stock" });

  if (item) item.quantity += quantity;
  else
    cart.items.push({
      product: productId,
      quantity,
      specialInstructions,
      ...choice,
    });
  await cart.save();
  res.status(201).json(await cartPayload(cart));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { quantity, optionName = "" } = req.body;
  const requestedAddOnsKey =
    typeof req.body.addOnsKey === "string"
      ? req.body.addOnsKey
      : normalizeAddOnRequest(req.body.addOns)
          .map((entry) => entry.toLowerCase())
          .sort()
          .join("|");
  const specialInstructions = normalizeSpecialInstructions(
    req.body.specialInstructions,
  );
  if (!Number.isInteger(quantity) || quantity < 1)
    return res
      .status(400)
      .json({ message: "Quantity must be a positive integer" });
  const cart = await getCart(req.user._id);
  const item = cart.items.find(
    (entry) => lineMatches(entry, {
      productId: req.params.productId,
      optionName,
      specialInstructions,
      addOnsKey: requestedAddOnsKey,
    }),
  );
  if (!item) return res.status(404).json({ message: "Cart item not found" });

  const product = await Product.findById(req.params.productId);
  if (!product || !product.isAvailable)
    return res.status(404).json({ message: "Food item is unavailable" });
  const availability = productAvailability(product);
  if (!availability.isOrderable)
    return res
      .status(400)
      .json({ message: availability.unavailableReason || "Food item is unavailable right now" });
  if (product.stock <= 0)
    return res.status(400).json({ message: "Food item is out of stock" });

  const requestedQuantity =
    cart.items
      .filter((entry) => entry.product.toString() === req.params.productId)
      .reduce((sum, entry) => sum + entry.quantity, 0) -
    item.quantity +
    quantity;
  if (requestedQuantity > product.stock)
    return res
      .status(400)
      .json({ message: "Requested quantity exceeds available stock" });

  item.quantity = quantity;
  await cart.save();
  res.json(await cartPayload(cart));
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const optionName = req.query.optionName || "";
  const requestedAddOnsKey = typeof req.query.addOnsKey === "string" ? req.query.addOnsKey : "";
  const specialInstructions = normalizeSpecialInstructions(
    req.query.specialInstructions,
  );
  const before = cart.items.length;
  cart.items = cart.items.filter(
    (item) =>
      item.product.toString() !== req.params.productId ||
      (item.optionName || "") !== optionName ||
      (item.specialInstructions || "") !== specialInstructions ||
      (item.addOnsKey || "") !== requestedAddOnsKey,
  );
  if (before === cart.items.length)
    return res.status(404).json({ message: "Cart item not found" });
  await cart.save();
  res.json(await cartPayload(cart));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json(await cartPayload(cart));
});
