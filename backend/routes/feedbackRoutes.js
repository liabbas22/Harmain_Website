import express from "express";
import {
  createFeedback,
  getFeedbackForAdmin,
  markFeedbackRead,
  updateFeedback,
} from "../controllers/feedbackController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.post("/", createFeedback);
router.get(
  "/admin",
  protect,
  authorize("admin"),
  requirePermission("feedback:manage"),
  getFeedbackForAdmin,
);
router.patch(
  "/admin/:id/read",
  protect,
  authorize("admin"),
  requirePermission("feedback:manage"),
  auditActivity("feedback.read", "feedback"),
  markFeedbackRead,
);
router.patch(
  "/admin/:id",
  protect,
  authorize("admin"),
  requirePermission("feedback:manage"),
  auditActivity("feedback.update", "feedback"),
  updateFeedback,
);

export default router;
