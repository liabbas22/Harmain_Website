import express from "express";
import {
  createCoupon,
  deleteCoupon,
  getCouponAvailability,
  getCoupons,
  updateCoupon,
  validateCouponCode,
} from "../controllers/couponController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.get("/availability", protect, getCouponAvailability);
router.post("/validate", protect, validateCouponCode);
router.use(protect, authorize("admin"));
router.get("/", requirePermission("offers:manage"), getCoupons);
router.post("/", requirePermission("offers:manage"), auditActivity("coupon.create", "coupon"), createCoupon);
router.patch("/:id", requirePermission("offers:manage"), auditActivity("coupon.update", "coupon"), updateCoupon);
router.delete("/:id", requirePermission("offers:manage"), auditActivity("coupon.delete", "coupon"), deleteCoupon);

export default router;
