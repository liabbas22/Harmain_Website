import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("category.create", "category"), createCategory);
router.patch("/:id", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("category.update", "category"), updateCategory);
router.delete("/:id", protect, authorize("admin"), requirePermission("menu:manage"), auditActivity("category.delete", "category"), deleteCategory);

export default router;
