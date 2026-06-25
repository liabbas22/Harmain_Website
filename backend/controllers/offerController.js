import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Offer from "../models/Offer.js";
import asyncHandler from "../utils/asyncHandler.js";
import { offerSummary, selectBestDiscount } from "../utils/offerService.js";

const requestError = (message) => { const error = new Error(message); error.statusCode = 400; return error; };
const numberValue = (value, label, { min = 0, integer = false } = {}) => { const parsed = Number(value); if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed))) throw requestError(`${label} is invalid.`); return parsed; };
const dateValue = (value, label, { optional = false } = {}) => { if (optional && (value === undefined || value === null || value === "")) return null; const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) throw requestError(`${label} is invalid.`); return parsed; };
const objectId = (value, label) => { if (!mongoose.isValidObjectId(value)) throw requestError(`${label} is invalid.`); return value; };

const offerPayload = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 3) throw requestError("Offer name must be at least 3 characters.");
  const discountType = body.discountType;
  if (!["percentage", "fixed"].includes(discountType)) throw requestError("Discount type is invalid.");
  const value = numberValue(body.value, "Discount value", { min: 0.01 });
  if (discountType === "percentage" && value > 100) throw requestError("Percentage discount cannot exceed 100.");
  const appliesTo = body.appliesTo;
  if (!["order", "category", "products"].includes(appliesTo)) throw requestError("Offer target is invalid.");
  const category = appliesTo === "category" ? objectId(body.category, "Category") : null;
  const products = appliesTo === "products" ? [...new Set((Array.isArray(body.products) ? body.products : []).map((id) => objectId(id, "Product")))] : [];
  if (appliesTo === "products" && !products.length) throw requestError("Select at least one product for this offer.");
  const startsAt = dateValue(body.startsAt || new Date(), "Start date");
  const expiresAt = dateValue(body.expiresAt, "Expiry date", { optional: true });
  if (expiresAt && expiresAt <= startsAt) throw requestError("Expiry date must be later than the start date.");
  const maxDiscount = body.maxDiscount === undefined || body.maxDiscount === null || body.maxDiscount === "" ? null : numberValue(body.maxDiscount, "Maximum discount", { min: 0.01 });
  return { name, description: typeof body.description === "string" ? body.description.trim() : "", discountType, value, appliesTo, category, products, minimumOrder: numberValue(body.minimumOrder ?? 0, "Minimum order"), maxDiscount: discountType === "percentage" ? maxDiscount : null, priority: numberValue(body.priority ?? 0, "Priority", { integer: true }), isActive: body.isActive !== false, startsAt, expiresAt };
};

const withTargets = (query) => query.populate("category", "name").populate("products", "name");
export const getOffers = asyncHandler(async (_req, res) => res.json(await withTargets(Offer.find().sort({ createdAt: -1 }))));
export const createOffer = asyncHandler(async (req, res) => { const offer = await Offer.create(offerPayload(req.body)); res.status(201).json(await withTargets(Offer.findById(offer._id))); });
export const updateOffer = asyncHandler(async (req, res) => { const current = await Offer.findById(req.params.id); if (!current) return res.status(404).json({ message: "Offer not found" }); const offer = await Offer.findByIdAndUpdate(req.params.id, offerPayload({ ...current.toObject(), ...req.body }), { new: true, runValidators: true }); res.json(await withTargets(Offer.findById(offer._id))); });
export const deleteOffer = asyncHandler(async (req, res) => { const offer = await Offer.findByIdAndDelete(req.params.id); if (!offer) return res.status(404).json({ message: "Offer not found" }); res.json({ message: "Offer deleted" }); });
export const quoteBestDiscount = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const items = cart?.items.filter((item) => item.product) || [];
  if (!items.length) return res.status(400).json({ message: "Your cart is empty" });
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice ?? item.product.price) * item.quantity, 0);
  const selection = await selectBestDiscount({ items, subtotal, userId: req.user._id, couponCode: req.body.couponCode || "" });
  res.json({ subtotal, automaticOffer: selection.automaticOffer ? offerSummary(selection.automaticOffer.offer, selection.automaticOffer.discount) : null, coupon: selection.couponResult ? { code: selection.couponResult.coupon.code, discount: selection.couponResult.discount } : null, applied: selection.applied ? { type: selection.applied.type, label: selection.applied.label, discount: selection.applied.discount } : null, total: Math.max(0, subtotal - (selection.applied?.discount || 0)) });
});
