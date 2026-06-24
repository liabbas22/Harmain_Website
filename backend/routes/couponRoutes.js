import express from "express";
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
  validateCouponCode,
} from "../controllers/couponController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/validate", protect, validateCouponCode);
router.use(protect, authorize("admin"));
router.get("/", getCoupons);
router.post("/", createCoupon);
router.patch("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
