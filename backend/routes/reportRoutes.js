import express from "express";
import { getReports } from "../controllers/reportController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/", getReports);

export default router;
