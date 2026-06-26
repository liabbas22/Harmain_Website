import Offer from "../models/Offer.js";
import { couponSnapshot, validateCoupon } from "./couponService.js";

const roundedMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const productId = (product) => String(product?._id || product || "");
const categoryId = (product) => String(product?.category?._id || product?.category || "");
const itemProduct = (item) => item.product || item;
const itemQuantity = (item) => Math.max(Number(item.quantity || 0), 0);
const lineTotal = (item) => roundedMoney(Number(item.unitPrice ?? item.price ?? item.product?.price ?? 0) * itemQuantity(item));
const toPlainObject = (entry) => entry?.toObject ? entry.toObject() : entry;
const activeOfferFilter = (now = new Date()) => ({
  isActive: true,
  startsAt: { $lte: now },
  $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
});

export const offerSnapshot = (offer, discount) => ({
  name: offer.name,
  discountType: offer.discountType,
  value: offer.value,
  appliesTo: offer.appliesTo,
  discount,
});

export const offerBreakdownSnapshot = (details = []) =>
  details.map((detail) => ({
    product: detail.productId || null,
    productName: detail.productName,
    optionName: detail.optionName || "",
    quantity: detail.quantity,
    offerName: detail.offer.name,
    discountType: detail.offer.discountType,
    value: detail.offer.value,
    discount: detail.discount,
  }));

export const offerSummary = (offer, discount) => ({
  _id: offer._id || null,
  name: offer.name,
  description: offer.description,
  discountType: offer.discountType,
  value: offer.value,
  appliesTo: offer.appliesTo,
  minimumOrder: offer.minimumOrder,
  maxDiscount: offer.maxDiscount,
  startsAt: offer.startsAt,
  expiresAt: offer.expiresAt,
  discount,
});

const offerLabel = (offer) => offer.discountType === "percentage" ? `${Number(offer.value).toString()}% OFF` : `Rs. ${roundedMoney(offer.value)} OFF`;

const productDisplayPrice = (product) => {
  const options = Array.isArray(product.options) ? product.options : [];
  const firstOption = options[0] || {};
  return Number(firstOption.discountPrice ?? firstOption.actualPrice ?? product.price ?? 0);
};

const productMatchesOffer = (product, offer) => {
  if (offer.appliesTo === "category") return categoryId(product) === String(offer.category?._id || offer.category || "");
  if (offer.appliesTo === "products") return new Set((offer.products || []).map(String)).has(productId(product));
  return false;
};

const orderOfferDiscount = (offer, amount) => {
  let discount = offer.discountType === "percentage" ? (amount * offer.value) / 100 : offer.value;
  if (offer.maxDiscount !== null && offer.maxDiscount !== undefined) discount = Math.min(discount, offer.maxDiscount);
  return Math.min(amount, roundedMoney(discount));
};

const itemOfferDiscount = (offer, item) => {
  const amount = lineTotal(item);
  if (amount <= 0) return 0;
  let discount = offer.discountType === "percentage" ? (amount * offer.value) / 100 : offer.value * itemQuantity(item);
  if (offer.maxDiscount !== null && offer.maxDiscount !== undefined) discount = Math.min(discount, offer.maxDiscount);
  return Math.min(amount, roundedMoney(discount));
};

const itemOfferDetail = (item, offer, discount) => {
  const product = itemProduct(item);
  return {
    productId: productId(product),
    productName: item.name || product?.name || "Menu item",
    optionName: item.optionName || "",
    quantity: itemQuantity(item),
    lineSubtotal: lineTotal(item),
    offer,
    offerLabel: offerLabel(offer),
    discount,
  };
};

const itemOfferSummary = (detail) => ({
  productId: detail.productId,
  productName: detail.productName,
  optionName: detail.optionName,
  quantity: detail.quantity,
  lineSubtotal: detail.lineSubtotal,
  offerName: detail.offer.name,
  offerLabel: detail.offerLabel,
  discountType: detail.offer.discountType,
  value: detail.offer.value,
  discount: detail.discount,
});

const bestItemOfferForLine = ({ item, offers, subtotal }) =>
  offers
    .map((offer) => {
      if (!["category", "products"].includes(offer.appliesTo)) return null;
      if (subtotal < Number(offer.minimumOrder || 0)) return null;
      if (!productMatchesOffer(itemProduct(item), offer)) return null;
      const discount = itemOfferDiscount(offer, item);
      return discount > 0 ? itemOfferDetail(item, offer, discount) : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority)[0] || null;

const aggregateItemOffers = ({ items, offers, subtotal }) => {
  const details = items.map((item) => bestItemOfferForLine({ item, offers, subtotal })).filter(Boolean);
  const discount = roundedMoney(details.reduce((sum, detail) => sum + detail.discount, 0));
  if (discount <= 0) return null;
  const priority = Math.max(...details.map((detail) => Number(detail.offer.priority || 0)), 0);
  return {
    kind: "items",
    label: details.length === 1 ? details[0].offer.name : "Item offers",
    offer: {
      name: details.length === 1 ? details[0].offer.name : "Item offers",
      description: "Best matching product and category offers",
      discountType: "fixed",
      value: discount,
      appliesTo: "products",
      minimumOrder: 0,
      maxDiscount: null,
      priority,
      startsAt: null,
      expiresAt: null,
    },
    discount,
    details,
  };
};

const bestOrderOffer = ({ offers, subtotal }) =>
  offers
    .map((offer) => {
      if (offer.appliesTo !== "order") return null;
      if (subtotal <= 0 || subtotal < Number(offer.minimumOrder || 0)) return null;
      const discount = orderOfferDiscount(offer, subtotal);
      return discount > 0 ? { kind: "order", label: offer.name, offer, discount, details: [] } : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority)[0] || null;

export const getBestAutomaticOffer = async ({ items, subtotal }) => {
  const offers = await Offer.find(activeOfferFilter());
  if (!offers.length) return null;

  const itemOffers = aggregateItemOffers({ items, offers, subtotal });
  const orderOffer = bestOrderOffer({ offers, subtotal });

  return [itemOffers, orderOffer]
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || Number(right.offer.priority || 0) - Number(left.offer.priority || 0))[0] || null;
};

export const automaticOfferSummary = (candidate) => candidate ? ({
  ...offerSummary(candidate.offer, candidate.discount),
  kind: candidate.kind,
  label: candidate.label,
  details: candidate.details.map(itemOfferSummary),
}) : null;

const productOfferDiscount = (offer, product) => {
  const price = productDisplayPrice(product);
  if (price <= 0) return 0;
  const fakeLine = { product, unitPrice: price, quantity: 1 };
  return itemOfferDiscount(offer, fakeLine);
};

export const attachActiveOffersToProducts = async (products) => {
  const entries = products.map(toPlainObject);
  if (!entries.length) return entries;

  const offers = await Offer.find({ ...activeOfferFilter(), appliesTo: { $in: ["category", "products"] } });
  if (!offers.length) return entries.map((product) => ({ ...product, activeOffer: null }));

  return entries.map((product) => {
    const bestOffer = offers
      .map((offer) => {
        if (!productMatchesOffer(product, offer)) return null;
        const discount = productOfferDiscount(offer, product);
        return discount > 0 ? { offer, discount } : null;
      })
      .filter(Boolean)
      .sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority)[0];

    return {
      ...product,
      activeOffer: bestOffer ? { ...offerSummary(bestOffer.offer, bestOffer.discount), label: offerLabel(bestOffer.offer) } : null,
    };
  });
};

export const selectBestDiscount = async ({ items, subtotal, userId, couponCode = "" }) => {
  const automaticOffer = await getBestAutomaticOffer({ items, subtotal });
  const couponResult = couponCode?.trim() ? await validateCoupon({ code: couponCode, subtotal, userId }) : null;
  const applied = couponResult && (!automaticOffer || couponResult.discount >= automaticOffer.discount)
    ? { type: "coupon", label: couponResult.coupon.code, discount: couponResult.discount, coupon: couponResult.coupon, details: [] }
    : automaticOffer
      ? { type: "offer", label: automaticOffer.label, discount: automaticOffer.discount, offer: automaticOffer.offer, details: automaticOffer.details, kind: automaticOffer.kind }
      : null;
  return { automaticOffer, couponResult, applied };
};

export { couponSnapshot };
