import express from "express";
import { getDeliverySettingsForAdmin, updateDeliverySettings } from "../controllers/settingsController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.use(protect, authorize("admin"), requirePermission("delivery:manage"));
router.get("/delivery", getDeliverySettingsForAdmin);
router.patch("/delivery", auditActivity("delivery_settings.update", "settings"), updateDeliverySettings);

export default router;
