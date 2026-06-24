import express from "express";
import {
  adminLogin,
  createRider,
  getMe,
  getRiders,
  login,
  register,
  updateRider,
} from "../controllers/authController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/me", protect, getMe);
router.get("/admin/me", protect, authorize("admin"), getMe);
router
  .route("/admin/riders")
  .get(protect, authorize("admin"), getRiders)
  .post(protect, authorize("admin"), createRider);
router.patch("/admin/riders/:id", protect, authorize("admin"), updateRider);
export default router;
