import express from "express";
import {
  addCustomerNote,
  deleteCustomerNote,
  getCustomerById,
  getCustomers,
  updateCustomerLoyalty,
  updateCustomerStatus,
} from "../controllers/customerController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";

const router = express.Router();

router.use(protect, authorize("admin"), requirePermission("customers:manage"));
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.patch("/:id/status", auditActivity("customer.status_update", "customer"), updateCustomerStatus);
router.patch("/:id/loyalty", auditActivity("customer.loyalty_update", "customer"), updateCustomerLoyalty);
router.post("/:id/notes", auditActivity("customer.note_create", "customer"), addCustomerNote);
router.delete("/:id/notes/:noteId", auditActivity("customer.note_delete", "customer"), deleteCustomerNote);

export default router;
