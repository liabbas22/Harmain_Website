import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calculateDeliveryCharge } from "../utils/deliverySettingsService.js";
import { automaticOfferSummary, selectBestDiscount } from "../utils/offerService.js";

const requestError = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; return error; };
const numberValue = (value, label, { min = 0, integer = false } = {}) => { const parsed = Number(value); if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed))) throw requestError(`${label} is invalid.`); return parsed; };
const dateValue = (value, label, { optional = false } = {}) => { if (optional && (value === undefined || value === null || value === "")) return null; const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) throw requestError(`${label} is invalid.`); return parsed; };
const objectId = (value, label) => { if (!mongoose.isValidObjectId(value)) throw requestError(`${label} is invalid.`); return value; };
const normalizeDealType = (body) => {
  const raw = String(body.dealType || body.type || "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (["buy_x_get_y", "bogo", "buy1get1", "buy_1_get_1", "buy_one_get_one"].includes(raw)) return "buy_x_get_y";
  if (["combo", "combo_deal", "bundle"].includes(raw)) return "combo";
  if (["discount", "standard", "normal"].includes(raw)) return "discount";
  if (body.comboPrice !== undefined && body.comboPrice !== null && body.comboPrice !== "") return "combo";
  if (body.buyQuantity !== undefined || body.getQuantity !== undefined) return "buy_x_get_y";
  return "discount";
};

const offerPayload = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 3) throw requestError("Offer name must be at least 3 characters.");
  const dealType = normalizeDealType(body);
  if (!["discount", "buy_x_get_y", "combo"].includes(dealType)) throw requestError("Deal type is invalid.");
  const discountType = dealType === "discount" ? (body.discountType || "percentage") : "fixed";
  if (!["percentage", "fixed"].includes(discountType)) throw requestError("Discount type is invalid.");
  const value = dealType === "discount" ? numberValue(body.value, "Discount value", { min: 0.01 }) : 0;
  if (dealType === "discount" && discountType === "percentage" && value > 100) throw requestError("Percentage discount cannot exceed 100.");
  const appliesTo = dealType === "combo" ? "products" : body.appliesTo;
  if (!["order", "category", "products"].includes(appliesTo)) throw requestError("Offer target is invalid.");
  if (dealType === "buy_x_get_y" && appliesTo === "order") throw requestError("Buy X Get Y must target products or a category.");
  const category = appliesTo === "category" ? objectId(body.category, "Category") : null;
  const products = appliesTo === "products" ? [...new Set((Array.isArray(body.products) ? body.products : []).map((id) => objectId(id, "Product")))] : [];
  if (appliesTo === "products" && !products.length) throw requestError("Select at least one product for this offer.");
  if (dealType === "combo" && products.length < 2) throw requestError("Select at least two products for a combo deal.");
  const startsAt = dateValue(body.startsAt || new Date(), "Start date");
  const expiresAt = dateValue(body.expiresAt, "Expiry date", { optional: true });
  if (expiresAt && expiresAt <= startsAt) throw requestError("Expiry date must be later than the start date.");
  const maxDiscount = body.maxDiscount === undefined || body.maxDiscount === null || body.maxDiscount === "" ? null : numberValue(body.maxDiscount, "Maximum discount", { min: 0.01 });
  return {
    name,
    description: typeof body.description === "string" ? body.description.trim() : "",
    dealType,
    discountType,
    value,
    appliesTo,
    category,
    products,
    buyQuantity: dealType === "buy_x_get_y" ? numberValue(body.buyQuantity ?? 1, "Buy quantity", { min: 1, integer: true }) : 1,
    getQuantity: dealType === "buy_x_get_y" ? numberValue(body.getQuantity ?? 1, "Free quantity", { min: 1, integer: true }) : 1,
    comboPrice: dealType === "combo" ? numberValue(body.comboPrice, "Combo price", { min: 0.01 }) : 0,
    minimumOrder: numberValue(body.minimumOrder ?? 0, "Minimum order"),
    maxDiscount: dealType === "discount" && discountType === "percentage" ? maxDiscount : null,
    priority: numberValue(body.priority ?? 0, "Priority", { integer: true }),
    isActive: body.isActive !== false,
    startsAt,
    expiresAt,
  };
};

const idString = (value) => String(value?._id || value || "");
const isProductTargetedOffer = (offer) =>
  offer.isActive !== false && offer.appliesTo !== "order";
const overlapFilter = ({ startsAt, expiresAt }) => ({
  startsAt: { $lte: expiresAt || new Date("9999-12-31T23:59:59.999Z") },
  $or: [{ expiresAt: null }, { expiresAt: { $gt: startsAt } }],
});
const offerTargetProductDocs = (offer, productById, productsByCategory) => {
  if (offer.appliesTo === "products") {
    return (offer.products || [])
      .map((product) => productById.get(idString(product)))
      .filter(Boolean);
  }
  if (offer.appliesTo === "category") {
    return productsByCategory.get(idString(offer.category)) || [];
  }
  return [];
};
const formattedOfferEnd = (offer) =>
  offer.expiresAt
    ? `until ${new Date(offer.expiresAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`
    : "with no expiry date";
const assertNoProductOfferConflict = async (payload, excludeId = null) => {
  if (!isProductTargetedOffer(payload)) return;

  const query = {
    isActive: true,
    appliesTo: { $in: ["category", "products"] },
    ...overlapFilter(payload),
  };
  if (excludeId) query._id = { $ne: excludeId };

  const existingOffers = await Offer.find(query)
    .populate("products", "name category")
    .populate("category", "name")
    .lean();
  if (!existingOffers.length) return;

  const categoryIds = [
    payload.category,
    ...existingOffers.map((offer) => offer.category),
  ]
    .map(idString)
    .filter(Boolean);
  const productIds = [
    ...(payload.products || []),
    ...existingOffers.flatMap((offer) => offer.products || []),
  ]
    .map(idString)
    .filter(Boolean);

  const productQuery = [];
  if (productIds.length) productQuery.push({ _id: { $in: productIds } });
  if (categoryIds.length)
    productQuery.push({ category: { $in: [...new Set(categoryIds)] } });
  if (!productQuery.length) return;

  const products = await Product.find({ $or: productQuery })
    .select("name category")
    .lean();
  const productById = new Map(products.map((product) => [idString(product), product]));
  const productsByCategory = products.reduce((map, product) => {
    const categoryId = idString(product.category);
    if (!map.has(categoryId)) map.set(categoryId, []);
    map.get(categoryId).push(product);
    return map;
  }, new Map());

  const targetProducts = offerTargetProductDocs(
    payload,
    productById,
    productsByCategory,
  );
  const targetIds = new Set(targetProducts.map(idString));
  if (!targetIds.size) return;

  const conflict = existingOffers
    .map((offer) => {
      const productsForOffer = offerTargetProductDocs(
        offer,
        productById,
        productsByCategory,
      );
      const conflictingProducts = productsForOffer.filter((product) =>
        targetIds.has(idString(product)),
      );
      return conflictingProducts.length
        ? { offer, conflictingProducts }
        : null;
    })
    .filter(Boolean)[0];

  if (!conflict) return;

  const productNames = conflict.conflictingProducts
    .slice(0, 4)
    .map((product) => product.name)
    .join(", ");
  const extraCount = conflict.conflictingProducts.length - 4;
  const suffix = extraCount > 0 ? ` and ${extraCount} more` : "";
  throw requestError(
    `Offer conflict: ${productNames}${suffix} already has "${conflict.offer.name}" ${formattedOfferEnd(conflict.offer)}. Disable, end, or wait for that offer to expire before adding another offer on the same product.`,
    409,
  );
};

const withTargets = (query) => query.populate("category", "name").populate("products", "name");
export const getOffers = asyncHandler(async (_req, res) => res.json(await withTargets(Offer.find().sort({ createdAt: -1 }))));
export const createOffer = asyncHandler(async (req, res) => {
  const payload = offerPayload(req.body);
  await assertNoProductOfferConflict(payload);
  const offer = await Offer.create(payload);
  res.status(201).json(await withTargets(Offer.findById(offer._id)));
});
export const updateOffer = asyncHandler(async (req, res) => {
  const current = await Offer.findById(req.params.id);
  if (!current) return res.status(404).json({ message: "Offer not found" });
  const payload = offerPayload({ ...current.toObject(), ...req.body });
  await assertNoProductOfferConflict(payload, current._id);
  const offer = await Offer.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  res.json(await withTargets(Offer.findById(offer._id)));
});
export const deleteOffer = asyncHandler(async (req, res) => { const offer = await Offer.findByIdAndDelete(req.params.id); if (!offer) return res.status(404).json({ message: "Offer not found" }); res.json({ message: "Offer deleted" }); });
export const quoteBestDiscount = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const items = cart?.items.filter((item) => item.product) || [];
  if (!items.length) return res.status(400).json({ message: "Your cart is empty" });
  const paidSubtotal = items.reduce((sum, item) => sum + (item.unitPrice ?? item.product.price) * item.quantity, 0);
  const selection = await selectBestDiscount({ items, subtotal: paidSubtotal, userId: req.user._id, couponCode: req.body.couponCode || "" });
  const subtotal = selection.subtotal ?? paidSubtotal;
  const discount = selection.applied?.discount || 0;
  const delivery = await calculateDeliveryCharge(
    paidSubtotal,
    req.body.deliveryAddress || {},
  );
  res.json({
    subtotal,
    paidSubtotal,
    grossSubtotalIncrease: selection.grossSubtotalIncrease || 0,
    automaticOffer: automaticOfferSummary(selection.automaticOffer),
    itemOffer: automaticOfferSummary(selection.itemOffer),
    extraAutomaticOffer: automaticOfferSummary(selection.extraAutomaticOffer),
    loyaltyOffer: automaticOfferSummary(selection.loyaltyOffer),
    coupon: selection.couponResult ? { code: selection.couponResult.coupon.code, discount: selection.couponResult.discount } : null,
    applied: selection.applied ? {
      type: selection.applied.type,
      label: selection.applied.label,
      discount: selection.applied.discount,
      itemDiscount: selection.applied.itemDiscount || 0,
      extraDiscount: selection.applied.extraDiscount || 0,
      couponDiscount: selection.applied.couponDiscount || 0,
      offerDiscount: selection.applied.offerDiscount || 0,
      loyaltyDiscount: selection.applied.loyaltyDiscount || 0,
      kind: selection.applied.kind || null,
      details: selection.applied.details || [],
    } : null,
    delivery,
    deliveryFee: delivery.deliveryFee,
    total: Math.max(0, subtotal - discount),
    grandTotal: Math.max(0, subtotal - discount + delivery.deliveryFee),
  });
});
