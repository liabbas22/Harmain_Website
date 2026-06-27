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

const router = express.Router();

router.get("/", getProducts);
router.get("/admin/export", protect, authorize("admin"), exportProducts);
router.post("/admin/import", protect, authorize("admin"), importProducts);
router.get("/:id", getProductById);
router.post("/", protect, authorize("admin"), createProduct);
router.patch("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
