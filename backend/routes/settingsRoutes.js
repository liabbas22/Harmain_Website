import express from "express";
import { getDeliverySettingsForAdmin, updateDeliverySettings } from "../controllers/settingsController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/delivery", getDeliverySettingsForAdmin);
router.patch("/delivery", updateDeliverySettings);

export default router;
