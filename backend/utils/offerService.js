import Offer from "../models/Offer.js";
import User from "../models/User.js";
import { couponSnapshot, validateCoupon } from "./couponService.js";
import { productAvailability } from "./productAvailability.js";

const roundedMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const productId = (product) => String(product?._id || product || "");
const categoryId = (product) => String(product?.category?._id || product?.category || "");
const itemProduct = (item) => item.product || item;
const itemQuantity = (item) => Math.max(Number(item.quantity || 0), 0);
const unitPrice = (item) => Number(item.unitPrice ?? item.price ?? item.product?.price ?? 0);
const lineTotal = (item) => roundedMoney(unitPrice(item) * itemQuantity(item));
const lineKey = (item) =>
  [
    productId(itemProduct(item)),
    item.optionName || "",
    item.specialInstructions || "",
    item.addOnsKey || "",
  ].join("::");
const toPlainObject = (entry) => entry?.toObject ? entry.toObject() : entry;
const dealType = (offer) => offer.dealType || "discount";
const activeOfferFilter = (now = new Date()) => ({
  isActive: true,
  startsAt: { $lte: now },
  $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
});

const offerLabel = (offer) => {
  if (dealType(offer) === "buy_x_get_y") return `Buy ${offer.buyQuantity || 1} Get ${offer.getQuantity || 1} Free`;
  if (dealType(offer) === "combo") return `Combo Rs. ${roundedMoney(offer.comboPrice)}`;
  return offer.discountType === "percentage" ? `${Number(offer.value).toString()}% OFF` : `Rs. ${roundedMoney(offer.value)} OFF`;
};

export const offerSnapshot = (offer, discount) => ({
  name: offer.name,
  dealType: dealType(offer),
  discountType: offer.discountType || "fixed",
  value: offer.value || 0,
  appliesTo: offer.appliesTo,
  buyQuantity: offer.buyQuantity || 1,
  getQuantity: offer.getQuantity || 1,
  comboPrice: offer.comboPrice || 0,
  discount,
});

export const loyaltySnapshot = (loyalty, discount) => ({
  label: loyalty.label || "Loyal customer discount",
  discountType: loyalty.discountType || "percentage",
  value: loyalty.value || 0,
  discount,
});

export const offerBreakdownSnapshot = (details = []) =>
  details.map((detail) => ({
    product: detail.productId || null,
    productName: detail.productName,
    optionName: detail.optionName || "",
    quantity: detail.quantity,
    freeQuantity: detail.freeQuantity || 0,
    grossQuantity: detail.grossQuantity || detail.quantity,
    lineSubtotal: detail.lineSubtotal || 0,
    freeItemValue: detail.freeItemValue || 0,
    offerName: detail.offer.name,
    dealType: dealType(detail.offer),
    discountType: detail.offer.discountType || "fixed",
    value: detail.offer.value || 0,
    discount: detail.discount,
  }));

export const offerSummary = (offer, discount) => ({
  _id: offer._id || null,
  name: offer.name,
  description: offer.description,
  dealType: dealType(offer),
  discountType: offer.discountType || "fixed",
  value: offer.value || 0,
  appliesTo: offer.appliesTo,
  buyQuantity: offer.buyQuantity || 1,
  getQuantity: offer.getQuantity || 1,
  comboPrice: offer.comboPrice || 0,
  minimumOrder: offer.minimumOrder,
  maxDiscount: offer.maxDiscount,
  startsAt: offer.startsAt,
  expiresAt: offer.expiresAt,
  discount,
});

const productDisplayPrice = (product) => {
  const options = Array.isArray(product.options) ? product.options : [];
  const firstOption = options[0] || {};
  return Number(firstOption.discountPrice ?? firstOption.actualPrice ?? product.price ?? 0);
};

const publicProductSummary = (product) => ({
  _id: productId(product),
  name: product?.name || "Menu item",
  image: product?.image || "",
  price: productDisplayPrice(product),
  options: Array.isArray(product?.options)
    ? product.options.map((option) => ({
        name: option.name,
        actualPrice: option.actualPrice,
        discountPrice: option.discountPrice,
      }))
    : [],
});

const selectedProducts = (offer) => new Set((offer.products || []).map(productId));

const productMatchesOffer = (product, offer) => {
  if (offer.appliesTo === "category") return categoryId(product) === String(offer.category?._id || offer.category || "");
  if (offer.appliesTo === "products" || dealType(offer) === "combo") return selectedProducts(offer).has(productId(product));
  return false;
};

const orderOfferDiscount = (offer, amount) => {
  let discount = offer.discountType === "percentage" ? (amount * offer.value) / 100 : offer.value;
  if (offer.maxDiscount !== null && offer.maxDiscount !== undefined) discount = Math.min(discount, offer.maxDiscount);
  return Math.min(amount, roundedMoney(discount));
};

const standardLineDiscount = (offer, item) => {
  const amount = lineTotal(item);
  if (amount <= 0) return 0;
  let discount = offer.discountType === "percentage" ? (amount * offer.value) / 100 : offer.value * itemQuantity(item);
  if (offer.maxDiscount !== null && offer.maxDiscount !== undefined) discount = Math.min(discount, offer.maxDiscount);
  return Math.min(amount, roundedMoney(discount));
};

const buyXGetYDiscount = (offer, item) => {
  const quantity = itemQuantity(item);
  const buyQuantity = Math.max(Number(offer.buyQuantity || 1), 1);
  const getQuantity = Math.max(Number(offer.getQuantity || 1), 1);
  const freeUnits = Math.floor(quantity / buyQuantity) * getQuantity;
  return roundedMoney(freeUnits * unitPrice(item));
};

const lineOfferDiscount = (offer, item) => {
  if (dealType(offer) === "buy_x_get_y") return buyXGetYDiscount(offer, item);
  if (dealType(offer) === "discount") return standardLineDiscount(offer, item);
  return 0;
};

const itemOfferDetail = (item, offer, discount) => {
  const product = itemProduct(item);
  const isFreeItemDeal = dealType(offer) === "buy_x_get_y";
  const freeQuantity = isFreeItemDeal
    ? Math.floor(itemQuantity(item) / Math.max(Number(offer.buyQuantity || 1), 1)) *
      Math.max(Number(offer.getQuantity || 1), 1)
    : 0;
  const freeItemValue = roundedMoney(freeQuantity * unitPrice(item));
  return {
    lineKey: lineKey(item),
    productId: productId(product),
    productName: item.name || product?.name || "Menu item",
    optionName: item.optionName || "",
    quantity: itemQuantity(item),
    freeQuantity,
    grossQuantity: itemQuantity(item) + freeQuantity,
    lineSubtotal: roundedMoney(lineTotal(item) + freeItemValue),
    freeItemValue,
    offer,
    offerLabel: offerLabel(offer),
    discount,
  };
};

const itemOfferSummary = (detail) => ({
  lineKey: detail.lineKey,
  productId: detail.productId,
  productName: detail.productName,
  optionName: detail.optionName,
  quantity: detail.quantity,
  freeQuantity: detail.freeQuantity || 0,
  grossQuantity: detail.grossQuantity || detail.quantity,
  lineSubtotal: detail.lineSubtotal,
  freeItemValue: detail.freeItemValue || 0,
  offerName: detail.offer.name,
  offerLabel: detail.offerLabel,
  dealType: dealType(detail.offer),
  discountType: detail.offer.discountType || "fixed",
  value: detail.offer.value || 0,
  discount: detail.discount,
});

const isDirectLineDeal = (offer) =>
  (dealType(offer) === "discount" && ["category", "products"].includes(offer.appliesTo)) ||
  (dealType(offer) === "buy_x_get_y" && ["category", "products"].includes(offer.appliesTo));

const bestItemOfferForLine = ({ item, offers, subtotal }) =>
  offers
    .map((offer) => {
      if (!isDirectLineDeal(offer)) return null;
      if (subtotal < Number(offer.minimumOrder || 0)) return null;
      if (!productMatchesOffer(itemProduct(item), offer)) return null;
      const discount = lineOfferDiscount(offer, item);
      return discount > 0 ? itemOfferDetail(item, offer, discount) : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority)[0] || null;

const aggregateItemOffers = ({ items, offers, subtotal }) => {
  const details = items.map((item) => bestItemOfferForLine({ item, offers, subtotal })).filter(Boolean);
  const discount = roundedMoney(details.reduce((sum, detail) => sum + detail.discount, 0));
  if (discount <= 0) return null;
  const grossSubtotalIncrease = roundedMoney(
    details.reduce((sum, detail) => sum + Number(detail.freeItemValue || 0), 0),
  );
  const priority = Math.max(...details.map((detail) => Number(detail.offer.priority || 0)), 0);
  return {
    kind: "items",
    label: details.length === 1 ? details[0].offer.name : "Item offers",
    offer: {
      name: details.length === 1 ? details[0].offer.name : "Item offers",
      description: "Best matching product, category and Buy X Get Y offers",
      dealType: "discount",
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
    grossSubtotalIncrease,
    details,
  };
};

const bestOrderOffer = ({ offers, subtotal, discountBase = subtotal }) =>
  offers
    .map((offer) => {
      if (dealType(offer) !== "discount" || offer.appliesTo !== "order") return null;
      if (subtotal <= 0 || subtotal < Number(offer.minimumOrder || 0)) return null;
      const discount = orderOfferDiscount(offer, discountBase);
      return discount > 0 ? { kind: "order", label: offer.name, offer, discount, details: [] } : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority)[0] || null;

const loyaltyCandidate = async ({ userId, subtotal, discountBase }) => {
  if (!userId) return null;
  const user = await User.findById(userId)
    .select("isActive loyaltyDiscount")
    .lean();
  const loyalty = user?.loyaltyDiscount;
  if (!user || user.isActive === false || !loyalty?.isEnabled) return null;
  if (loyalty.expiresAt && new Date(loyalty.expiresAt) <= new Date()) return null;
  if (subtotal < Number(loyalty.minimumOrder || 0)) return null;

  let discount =
    loyalty.discountType === "fixed"
      ? Number(loyalty.value || 0)
      : (discountBase * Number(loyalty.value || 0)) / 100;
  if (loyalty.maxDiscount !== null && loyalty.maxDiscount !== undefined)
    discount = Math.min(discount, Number(loyalty.maxDiscount || 0));
  discount = Math.min(discountBase, roundedMoney(discount));
  if (discount <= 0) return null;

  const label = loyalty.label || "Loyal customer discount";
  return {
    kind: "loyalty",
    label,
    offer: {
      name: label,
      description: loyalty.note || "Customer-specific loyalty saving.",
      dealType: "discount",
      discountType: loyalty.discountType || "percentage",
      value: Number(loyalty.value || 0),
      appliesTo: "order",
      minimumOrder: Number(loyalty.minimumOrder || 0),
      maxDiscount: loyalty.maxDiscount ?? null,
      priority: 0,
      startsAt: null,
      expiresAt: loyalty.expiresAt || null,
    },
    loyalty,
    discount,
    details: [],
  };
};

const cartItemsForProduct = (items, id) => items.filter((item) => productId(itemProduct(item)) === id && itemQuantity(item) > 0);

const comboCandidate = ({ offer, items, subtotal }) => {
  if (dealType(offer) !== "combo" || subtotal < Number(offer.minimumOrder || 0)) return null;
  const productIds = [...selectedProducts(offer)];
  if (productIds.length < 2) return null;

  const groups = productIds.map((id) => cartItemsForProduct(items, id));
  if (groups.some((group) => !group.length)) return null;

  const comboCount = Math.min(...groups.map((group) => group.reduce((sum, item) => sum + itemQuantity(item), 0)));
  if (comboCount <= 0) return null;

  const chosenItems = groups.map((group) => group.slice().sort((left, right) => unitPrice(left) - unitPrice(right))[0]);
  const regularComboTotal = roundedMoney(chosenItems.reduce((sum, item) => sum + unitPrice(item), 0));
  const comboPrice = roundedMoney(offer.comboPrice);
  const discountPerCombo = regularComboTotal - comboPrice;
  if (comboPrice <= 0 || discountPerCombo <= 0) return null;

  const discount = roundedMoney(discountPerCombo * comboCount);
  const productName = `Combo: ${chosenItems.map((item) => itemProduct(item)?.name || item.name || "Menu item").join(" + ")}`;
  return {
    kind: "combo",
    label: offer.name,
    offer,
    discount,
    details: [{
      productId: null,
      productName,
      optionName: "",
      quantity: comboCount,
      lineSubtotal: roundedMoney(regularComboTotal * comboCount),
      offer,
      offerLabel: offerLabel(offer),
      discount,
    }],
  };
};

const bestComboOffer = ({ offers, items, subtotal }) =>
  offers
    .map((offer) => comboCandidate({ offer, items, subtotal }))
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || right.offer.priority - left.offer.priority)[0] || null;

const cappedCandidate = (candidate, maxDiscount) => {
  if (!candidate) return null;
  const cappedDiscount = roundedMoney(
    Math.min(Math.max(Number(maxDiscount || 0), 0), candidate.discount),
  );
  if (cappedDiscount <= 0) return null;
  if (cappedDiscount === candidate.discount) return candidate;
  const details =
    candidate.details?.length === 1
      ? [{ ...candidate.details[0], discount: cappedDiscount }]
      : candidate.details || [];
  return { ...candidate, discount: cappedDiscount, details };
};

const combinedAutomaticCandidate = ({ itemOffers, extraOffer }) => {
  const discount = roundedMoney(
    Number(itemOffers?.discount || 0) + Number(extraOffer?.discount || 0),
  );
  if (discount <= 0) return null;
  const details = [
    ...(itemOffers?.details || []),
    ...(extraOffer?.details || []),
  ];
  const priority = Math.max(
    Number(itemOffers?.offer?.priority || 0),
    Number(extraOffer?.offer?.priority || 0),
    0,
  );
  const label =
    itemOffers && extraOffer
      ? "Automatic savings"
      : itemOffers?.label || extraOffer?.label || "Automatic savings";
  return {
    kind: itemOffers && extraOffer ? "combined" : itemOffers?.kind || extraOffer?.kind,
    label,
    offer: {
      name: label,
      description: itemOffers && extraOffer
        ? "Item offers plus the best cart-level saving."
        : itemOffers?.offer?.description || extraOffer?.offer?.description || "",
      dealType: "discount",
      discountType: "fixed",
      value: discount,
      appliesTo: "order",
      minimumOrder: 0,
      maxDiscount: null,
      priority,
      startsAt: null,
      expiresAt: null,
    },
    discount,
    grossSubtotalIncrease: itemOffers?.grossSubtotalIncrease || 0,
    details,
  };
};

export const getComboSuggestionsForCart = async (items = []) => {
  const activeItems = items.filter((item) => itemQuantity(item) > 0 && itemProduct(item));
  if (!activeItems.length) return [];

  const presentPriceByProduct = new Map();
  activeItems.forEach((item) => {
    const product = itemProduct(item);
    const id = productId(product);
    if (!id) return;
    const price = unitPrice(item) || productDisplayPrice(product);
    const currentPrice = presentPriceByProduct.get(id);
    if (!currentPrice || price < currentPrice) presentPriceByProduct.set(id, price);
  });

  if (!presentPriceByProduct.size) return [];

  const offers = await Offer.find({ ...activeOfferFilter(), dealType: "combo" })
    .populate({
      path: "products",
      select: "name price image options isAvailable stock availabilitySchedule",
    });

  return offers
    .map((offer) => {
      const comboProducts = (offer.products || []).filter((product) => productId(product));
      if (comboProducts.length < 2) return null;

      const presentProducts = comboProducts.filter((product) =>
        presentPriceByProduct.has(productId(product)),
      );
      const missingProducts = comboProducts.filter((product) =>
        !presentPriceByProduct.has(productId(product)),
      );

      if (!presentProducts.length || !missingProducts.length) return null;
      if (
        missingProducts.some(
          (product) => product.isAvailable === false || Number(product.stock || 0) <= 0,
        ) ||
        missingProducts.some(
          (product) => productAvailability(product).isOrderable === false,
        )
      ) {
        return null;
      }

      const comboPrice = roundedMoney(offer.comboPrice);
      if (comboPrice <= 0) return null;

      const regularTotal = roundedMoney(
        comboProducts.reduce((sum, product) => {
          const id = productId(product);
          return sum + (presentPriceByProduct.get(id) || productDisplayPrice(product));
        }, 0),
      );
      const estimatedSaving = roundedMoney(Math.max(0, regularTotal - comboPrice));
      if (estimatedSaving <= 0) return null;

      return {
        offerId: offer._id,
        name: offer.name,
        description: offer.description,
        comboPrice,
        regularTotal,
        estimatedSaving,
        missingCount: missingProducts.length,
        presentCount: presentProducts.length,
        totalProducts: comboProducts.length,
        matchedProducts: presentProducts.map(publicProductSummary),
        missingProducts: missingProducts.map(publicProductSummary),
        expiresAt: offer.expiresAt,
        priority: Number(offer.priority || 0),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.estimatedSaving - left.estimatedSaving || right.priority - left.priority)
    .slice(0, 3)
    .map(({ priority, ...suggestion }) => suggestion);
};

export const getBestAutomaticOffer = async ({ items, subtotal }) => {
  const offers = await Offer.find(activeOfferFilter());
  if (!offers.length) return null;

  const itemOffers = aggregateItemOffers({ items, offers, subtotal });
  const itemDiscount = Number(itemOffers?.discount || 0);
  const pricingSubtotal = roundedMoney(
    subtotal + Number(itemOffers?.grossSubtotalIncrease || 0),
  );
  const remainingSubtotal = Math.max(0, roundedMoney(pricingSubtotal - itemDiscount));
  const comboOffer = cappedCandidate(
    bestComboOffer({ offers, items, subtotal: pricingSubtotal }),
    remainingSubtotal,
  );
  const orderOffer = bestOrderOffer({
    offers,
    subtotal: pricingSubtotal,
    discountBase: remainingSubtotal,
  });
  const extraOffer = [comboOffer, orderOffer]
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || Number(right.offer.priority || 0) - Number(left.offer.priority || 0))[0] || null;

  return combinedAutomaticCandidate({ itemOffers, extraOffer });
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
  const fakeLine = { product, unitPrice: price, quantity: dealType(offer) === "buy_x_get_y" ? offer.buyQuantity || 1 : 1 };
  return lineOfferDiscount(offer, fakeLine);
};

export const attachActiveOffersToProducts = async (products) => {
  const entries = products.map(toPlainObject);
  if (!entries.length) return entries;

  const offers = await Offer.find({ ...activeOfferFilter(), $or: [{ appliesTo: { $in: ["category", "products"] } }, { dealType: "combo" }] });
  if (!offers.length) return entries.map((product) => ({ ...product, activeOffer: null }));

  return entries.map((product) => {
    const bestOffer = offers
      .map((offer) => {
        if (dealType(offer) === "combo") {
          return productMatchesOffer(product, offer) ? { offer, discount: 0 } : null;
        }
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
  const offers = await Offer.find(activeOfferFilter());
  const itemOffer = offers.length
    ? aggregateItemOffers({ items, offers, subtotal })
    : null;
  const itemDiscount = Number(itemOffer?.discount || 0);
  const grossSubtotalIncrease = Number(itemOffer?.grossSubtotalIncrease || 0);
  const pricingSubtotal = roundedMoney(subtotal + grossSubtotalIncrease);
  const remainingSubtotal = Math.max(0, roundedMoney(pricingSubtotal - itemDiscount));
  const comboOffer = offers.length
    ? cappedCandidate(bestComboOffer({ offers, items, subtotal: pricingSubtotal }), remainingSubtotal)
    : null;
  const orderOffer = offers.length
    ? bestOrderOffer({ offers, subtotal: pricingSubtotal, discountBase: remainingSubtotal })
    : null;
  const customerLoyaltyOffer = await loyaltyCandidate({
    userId,
    subtotal: pricingSubtotal,
    discountBase: remainingSubtotal,
  });
  const extraAutomaticOffer = [comboOffer, orderOffer, customerLoyaltyOffer]
    .filter(Boolean)
    .sort((left, right) => right.discount - left.discount || Number(right.offer.priority || 0) - Number(left.offer.priority || 0))[0] || null;
  const automaticOffer = combinedAutomaticCandidate({ itemOffers: itemOffer, extraOffer: extraAutomaticOffer });
  const couponResult = couponCode?.trim()
    ? await validateCoupon({
        code: couponCode,
        subtotal: remainingSubtotal,
        eligibilitySubtotal: subtotal,
        userId,
      })
    : null;
  const useCoupon =
    couponResult &&
    (!extraAutomaticOffer || couponResult.discount >= extraAutomaticOffer.discount);
  const extraDiscount = Number(
    useCoupon ? couponResult.discount : extraAutomaticOffer?.discount || 0,
  );
  const discount = roundedMoney(Math.min(pricingSubtotal, itemDiscount + extraDiscount));
  const itemDetails = itemOffer?.details || [];
  const applied = discount > 0
    ? useCoupon
      ? {
          type: "coupon",
          label: couponResult.coupon.code,
          discount,
          itemDiscount,
          extraDiscount,
          couponDiscount: extraDiscount,
          coupon: couponResult.coupon,
          details: itemDetails,
        }
      : extraAutomaticOffer
        ? {
            type: "offer",
            label: extraAutomaticOffer.label,
            discount,
            itemDiscount,
            extraDiscount,
            offerDiscount: extraDiscount,
            loyaltyDiscount: extraAutomaticOffer.kind === "loyalty" ? extraDiscount : 0,
            offer: extraAutomaticOffer.offer,
            loyalty: extraAutomaticOffer.loyalty || null,
            details: [...itemDetails, ...(extraAutomaticOffer.details || [])],
            kind: extraAutomaticOffer.kind,
          }
        : itemOffer
          ? {
              type: "offer",
              label: itemOffer.label,
              discount,
              itemDiscount,
              extraDiscount: 0,
              offerDiscount: itemDiscount,
              offer: itemOffer.offer,
              details: itemDetails,
              kind: itemOffer.kind,
            }
          : null
    : null;

  return {
    automaticOffer,
    itemOffer,
    extraAutomaticOffer,
    loyaltyOffer: customerLoyaltyOffer,
    couponResult,
    applied,
    itemDiscount,
    extraDiscount,
    discount,
    paidSubtotal: subtotal,
    subtotal: pricingSubtotal,
    grossSubtotalIncrease,
  };
};

export { couponSnapshot };
