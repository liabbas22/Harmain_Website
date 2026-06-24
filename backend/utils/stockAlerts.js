export const LOW_STOCK_THRESHOLD = 5;

const stockAlertPayload = (product) => {
  const stock = Number(product?.stock);
  if (!product?._id || !Number.isFinite(stock) || stock > LOW_STOCK_THRESHOLD)
    return null;

  return {
    product: {
      _id: product._id.toString(),
      name: product.name,
      image: product.image || "",
      isAvailable: product.isAvailable !== false,
      stock,
    },
    kind: stock === 0 ? "out_of_stock" : "low_stock",
    threshold: LOW_STOCK_THRESHOLD,
  };
};

export const emitStockAlert = (req, product, previousStock) => {
  const alert = stockAlertPayload(product);
  if (!alert) return;

  const previous = Number(previousStock);
  if (Number.isFinite(previous) && previous === alert.product.stock) return;

  req.app.get("io")?.to("admin-orders").emit("stock:alert", alert);
};
