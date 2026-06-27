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

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.patch("/:id/status", updateCustomerStatus);
router.patch("/:id/loyalty", updateCustomerLoyalty);
router.post("/:id/notes", addCustomerNote);
router.delete("/:id/notes/:noteId", deleteCustomerNote);

export default router;
