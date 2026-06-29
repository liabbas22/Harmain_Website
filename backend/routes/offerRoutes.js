import express from "express";
import { createOffer, deleteOffer, getOffers, quoteBestDiscount, updateOffer } from "../controllers/offerController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();
router.post("/quote", protect, quoteBestDiscount);
router.use(protect, authorize("admin"));
router.get("/", requirePermission("offers:manage"), getOffers);
router.post("/", requirePermission("offers:manage"), auditActivity("offer.create", "offer"), createOffer);
router.patch("/:id", requirePermission("offers:manage"), auditActivity("offer.update", "offer"), updateOffer);
router.delete("/:id", requirePermission("offers:manage"), auditActivity("offer.delete", "offer"), deleteOffer);
export default router;
