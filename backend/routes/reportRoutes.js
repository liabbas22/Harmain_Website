import express from "express";
import { getReports } from "../controllers/reportController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"), requirePermission("reports:read"));
router.get("/", getReports);

export default router;
