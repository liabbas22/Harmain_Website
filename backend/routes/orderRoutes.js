import express from "express";
import {
  assignRider,
  checkout,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";
const router = express.Router();
router.use(protect);
router.post("/checkout", checkout);
router.get("/my", getMyOrders);
router.get("/", authorize("admin"), requirePermission("orders:manage"), getOrders);
router.patch("/:id/rider", authorize("admin"), requirePermission("orders:manage"), auditActivity("order.assign_rider", "order"), assignRider);
router.get("/:id", getOrderById);
router.patch("/:id/status", authorize("admin"), requirePermission("orders:manage"), auditActivity("order.status_update", "order"), updateOrderStatus);
export default router;
