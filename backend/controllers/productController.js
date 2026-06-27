import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { attachActiveOffersToProducts } from "../utils/offerService.js";
import { productPayloadWithAvailability } from "../utils/productAvailability.js";
import { emitStockAlert } from "../utils/stockAlerts.js";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const moneyValue = (value, fallback = 0) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
const hasMoneyValue = (value) =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0;
const boolValue = (value, fallback = false) =>
  typeof value === "boolean" ? value : fallback;
const timeValue = (value) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(cleanString(value))
    ? cleanString(value)
    : "";
const productResponse = async (products) =>
  (await attachActiveOffersToProducts(products)).map(productPayloadWithAvailability);

const normalizeProductPayload = (body = {}) => {
  const tags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || "")
        .split(",");
  const options = (Array.isArray(body.options) ? body.options : [])
    .map((option) => {
      const hasActualPrice = hasMoneyValue(option.actualPrice);
      const hasDiscountPrice = hasMoneyValue(option.discountPrice);
      const actualPrice = hasActualPrice
        ? moneyValue(option.actualPrice)
        : moneyValue(option.discountPrice);
      return {
        name: cleanString(option.name || "Regular"),
        actualPrice,
        ...(hasDiscountPrice ? { discountPrice: moneyValue(option.discountPrice) } : {}),
        tag: cleanString(option.tag),
      };
    })
    .filter((option) => option.name && option.actualPrice > 0);
  const addOns = (Array.isArray(body.addOns) ? body.addOns : [])
    .map((addOn) => ({
      name: cleanString(addOn.name),
      price: moneyValue(addOn.price),
      isAvailable: addOn.isAvailable !== false,
    }))
    .filter((addOn) => addOn.name && addOn.price >= 0);
  const schedule = body.availabilitySchedule || {};
  const days = Array.isArray(schedule.days)
    ? [...new Set(schedule.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    : [];
  const firstOption = options[0];
  const comboItems =
    body.isComboMeal === true && Array.isArray(body.comboItems)
      ? body.comboItems
          .map((item) => ({
            product: item.product?._id || item.product,
            quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
            label: cleanString(item.label),
            optionName: cleanString(item.optionName),
          }))
          .filter((item) => mongoose.isValidObjectId(item.product))
      : [];

  return {
    name: cleanString(body.name),
    description: cleanString(body.description),
    image: cleanString(body.image),
    category: body.category,
    price: moneyValue(
      body.price,
      firstOption?.discountPrice ?? firstOption?.actualPrice ?? 0,
    ),
    stock: Math.max(0, Math.floor(Number(body.stock || 0))),
    tags: tags.map(cleanString).filter(Boolean),
    options,
    addOns,
    availabilitySchedule: {
      isEnabled: boolValue(schedule.isEnabled, false),
      days,
      startTime: timeValue(schedule.startTime),
      endTime: timeValue(schedule.endTime),
      message: cleanString(schedule.message).slice(0, 140),
    },
    isAvailable: body.isAvailable !== false,
    isFeatured: body.isFeatured === true,
    isPopular: body.isPopular === true,
    isComboMeal: body.isComboMeal === true,
    comboItems,
    displayOrder: Number.isFinite(Number(body.displayOrder))
      ? Number(body.displayOrder)
      : 0,
  };
};

const resolveCategoryId = async (entry) => {
  const rawCategory = entry.category?._id || entry.category || entry.categoryId;
  if (rawCategory && mongoose.isValidObjectId(rawCategory)) return rawCategory;
  const categoryName = cleanString(entry.categoryName || entry.category?.name);
  if (!categoryName) return null;
  const category = await Category.findOne({
    name: new RegExp(`^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  return category?._id || null;
};

export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    available,
    featured,
    popular,
    combo,
    page = 1,
    limit = 24,
  } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available === "true";
  if (featured !== undefined) filter.isFeatured = featured === "true";
  if (popular !== undefined) filter.isPopular = popular === "true";
  if (combo !== undefined) filter.isComboMeal = combo === "true";
  if (search?.trim()) filter.$text = { $search: search.trim() };
  const currentPage = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);
  const [productDocs, total] = await Promise.all([
    Product.find(filter)
      .populate("category")
      .populate("comboItems.product", "name price image options")
      .sort({ displayOrder: 1, isFeatured: -1, isPopular: -1, createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);
  const products = await productResponse(productDocs);
  res.json({
    products,
    pagination: { page: currentPage, limit: pageSize, total },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category")
    .populate("comboItems.product", "name price image options");
  if (!product) return res.status(404).json({ message: "Product not found" });
  const [productWithOffer] = await productResponse([product]);
  res.json(productWithOffer);
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  const product = await Product.create(payload);
  emitStockAlert(req, product);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const currentProduct = await Product.findById(req.params.id);
  if (!currentProduct)
    return res.status(404).json({ message: "Product not found" });

  const product = await Product.findByIdAndUpdate(req.params.id, normalizeProductPayload(req.body), {
    new: true,
    runValidators: true,
  }).populate("category").populate("comboItems.product", "name price image options");
  if (!product) return res.status(404).json({ message: "Product not found" });
  emitStockAlert(req, product, currentProduct.stock);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
});

export const exportProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("comboItems.product", "name options")
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  const payload = products.map((product) => ({
    id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category?._id || product.category,
    categoryName: product.category?.name || "",
    stock: product.stock,
    tags: product.tags || [],
    options: product.options || [],
    addOns: product.addOns || [],
    availabilitySchedule: product.availabilitySchedule || {},
    isAvailable: product.isAvailable !== false,
    isFeatured: product.isFeatured === true,
    isPopular: product.isPopular === true,
    isComboMeal: product.isComboMeal === true,
    comboItems: (product.comboItems || []).map((item) => ({
      product: item.product?._id || item.product,
      productName: item.product?.name || item.label || "",
      quantity: item.quantity || 1,
      label: item.label || item.product?.name || "",
      optionName: item.optionName || "",
    })),
    displayOrder: product.displayOrder || 0,
  }));
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="harmain-products-${Date.now()}.json"`,
  );
  res.json(payload);
});

export const importProducts = asyncHandler(async (req, res) => {
  const entries = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body.products)
      ? req.body.products
      : [];
  if (!entries.length)
    return res.status(400).json({ message: "Import file has no products" });

  const result = { created: 0, updated: 0, failed: 0, errors: [] };

  for (const [index, entry] of entries.entries()) {
    try {
      const category = await resolveCategoryId(entry);
      if (!category) throw new Error("Category could not be matched");
      const payload = normalizeProductPayload({ ...entry, category });
      if (!payload.name) throw new Error("Product name is required");
      let product = null;
      let wasExisting = false;
      const id = entry.id || entry._id;
      if (id && mongoose.isValidObjectId(id)) {
        wasExisting = Boolean(await Product.exists({ _id: id }));
        product = await Product.findByIdAndUpdate(id, payload, {
          new: true,
          runValidators: true,
        });
      }
      if (!product) {
        wasExisting = Boolean(
          await Product.exists({ name: payload.name, category }),
        );
        product = await Product.findOneAndUpdate(
          { name: payload.name, category },
          payload,
          { new: true, upsert: true, runValidators: true },
        );
      }
      if (wasExisting) result.updated += 1;
      else result.created += 1;
      emitStockAlert(req, product);
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: index + 1,
        name: entry?.name || "",
        message: error.message || "Product could not be imported",
      });
    }
  }

  res.json(result);
});
