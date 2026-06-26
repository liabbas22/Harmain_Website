import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { attachActiveOffersToProducts } from "../utils/offerService.js";
import { emitStockAlert } from "../utils/stockAlerts.js";

export const getProducts = asyncHandler(async (req, res) => {
  const { category, search, available, page = 1, limit = 24 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available === "true";
  if (search?.trim()) filter.$text = { $search: search.trim() };
  const currentPage = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);
  const [productDocs, total] = await Promise.all([
    Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);
  const products = await attachActiveOffersToProducts(productDocs);
  res.json({
    products,
    pagination: { page: currentPage, limit: pageSize, total },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(404).json({ message: "Product not found" });
  const [productWithOffer] = await attachActiveOffersToProducts([product]);
  res.json(productWithOffer);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  emitStockAlert(req, product);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const currentProduct = await Product.findById(req.params.id);
  if (!currentProduct)
    return res.status(404).json({ message: "Product not found" });

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("category");
  if (!product) return res.status(404).json({ message: "Product not found" });
  emitStockAlert(req, product, currentProduct.stock);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
});
