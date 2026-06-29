import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  deleteProduct,
  exportProducts,
  importProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/admin/export", protect, authorize("admin"), requirePermission("menu:manage"), exportProducts);
router.post("/admin/import", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("product.import", "product"), importProducts);
router.get("/:id", getProductById);
router.post("/", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("product.create", "product"), createProduct);
router.patch("/:id", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("product.update", "product"), updateProduct);
router.delete("/:id", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("product.delete", "product"), deleteProduct);

export default router;
