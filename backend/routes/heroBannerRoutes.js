import express from "express";
import {
  createHeroBanner,
  deleteHeroBanner,
  getActiveHeroBanners,
  getHeroBannersForAdmin,
  updateHeroBanner,
} from "../controllers/heroBannerController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.get("/", getActiveHeroBanners);
router.get(
  "/admin",
  protect,
  authorize("admin"),
  requirePermission("content:manage"),
  getHeroBannersForAdmin,
);
router.post(
  "/admin",
  protect,
  authorize("admin"),
  requirePermission("content:manage"),
  auditActivity("hero_banner.create", "hero_banner"),
  createHeroBanner,
);
router.patch(
  "/admin/:id",
  protect,
  authorize("admin"),
  requirePermission("content:manage"),
  auditActivity("hero_banner.update", "hero_banner"),
  updateHeroBanner,
);
router.delete(
  "/admin/:id",
  protect,
  authorize("admin"),
  requirePermission("content:manage"),
  auditActivity("hero_banner.delete", "hero_banner"),
  deleteHeroBanner,
);

export default router;
