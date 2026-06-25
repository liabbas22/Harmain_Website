import express from "express";
import { createOffer, deleteOffer, getOffers, quoteBestDiscount, updateOffer } from "../controllers/offerController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/quote", protect, quoteBestDiscount);
router.use(protect, authorize("admin"));
router.get("/", getOffers);
router.post("/", createOffer);
router.patch("/:id", updateOffer);
router.delete("/:id", deleteOffer);
export default router;
