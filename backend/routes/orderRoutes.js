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
const router = express.Router();
router.use(protect);
router.post("/checkout", checkout);
router.get("/my", getMyOrders);
router.get("/", authorize("admin"), getOrders);
router.patch("/:id/rider", authorize("admin"), assignRider);
router.get("/:id", getOrderById);
router.patch("/:id/status", authorize("admin"), updateOrderStatus);
export default router;
