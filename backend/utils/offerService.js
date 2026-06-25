import Offer from "../models/Offer.js";
import { couponSnapshot, validateCoupon } from "./couponService.js";

const roundedMoney = (value) => Math.round(value * 100) / 100;
const productId = (product) => String(product?._id || product || "");
const categoryId = (product) => String(product?.category?._id || product?.category || "");
const lineTotal = (item) => Number(item.unitPrice ?? item.price ?? item.product?.price ?? 0) * Number(item.quantity || 0);

export const offerSnapshot = (offer, discount) => ({ name: offer.name, discountType: offer.discountType, value: offer.value, appliesTo: offer.appliesTo, discount });
export const offerSummary = (offer, discount) => ({ name: offer.name, description: offer.description, discountType: offer.discountType, value: offer.value, appliesTo: offer.appliesTo, minimumOrder: offer.minimumOrder, maxDiscount: offer.maxDiscount, discount });

const eligibleSubtotal = (offer, items, subtotal) => {
  if (offer.appliesTo === "order") return subtotal;
  const selectedProducts = new Set((offer.products || []).map(String));
  const selectedCategory = String(offer.category?._id || offer.category || "");
  return items.reduce((sum, item) => {
    const isEligible = offer.appliesTo === "category" ? categoryId(item.product) === selectedCategory : selectedProducts.has(productId(item.product));
    return isEligible ? sum + lineTotal(item) : sum;
  }, 0);
};

export const getBestAutomaticOffer = async ({ items, subtotal }) => {
  const now = new Date();
  const offers = await Offer.find({ isActive: true, startsAt: { $lte: now }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
  const candidates = offers.map((offer) => {
    const applicableSubtotal = eligibleSubtotal(offer, items, subtotal);
    if (applicableSubtotal <= 0 || subtotal < offer.minimumOrder) return null;
    let discount = offer.discountType === "percentage" ? (applicableSubtotal * offer.value) / 100 : offer.value;
    if (offer.maxDiscount !== null && offer.maxDiscount !== undefined) discount = Math.min(discount, offer.maxDiscount);
    return { offer, discount: Math.min(applicableSubtotal, roundedMoney(discount)) };
  }).filter(Boolean).filter((candidate) => candidate.discount > 0).sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority);
  return candidates[0] || null;
};

export const selectBestDiscount = async ({ items, subtotal, userId, couponCode = "" }) => {
  const automaticOffer = await getBestAutomaticOffer({ items, subtotal });
  const couponResult = couponCode?.trim() ? await validateCoupon({ code: couponCode, subtotal, userId }) : null;
  const applied = couponResult && (!automaticOffer || couponResult.discount >= automaticOffer.discount)
    ? { type: "coupon", label: couponResult.coupon.code, discount: couponResult.discount, coupon: couponResult.coupon }
    : automaticOffer
      ? { type: "offer", label: automaticOffer.offer.name, discount: automaticOffer.discount, offer: automaticOffer.offer }
      : null;
  return { automaticOffer, couponResult, applied };
};

export { couponSnapshot };
