import express from "express";
import {
  addAddress,
  adminLogin,
  changeAdminPassword,
  createAdminUser,
  createRider,
  deleteAddress,
  getAdminActivity,
  getAdminUsers,
  getMe,
  getRiders,
  login,
  logoutAdminSessions,
  register,
  updateAddress,
  updateAdminUser,
  updateMe,
  updateRider,
} from "../controllers/authController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { auditActivity } from "../utils/adminActivity.js";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.post("/me/addresses", protect, addAddress);
router.patch("/me/addresses/:addressId", protect, updateAddress);
router.delete("/me/addresses/:addressId", protect, deleteAddress);
router.get("/admin/me", protect, authorize("admin"), getMe);
router.patch(
  "/admin/password",
  protect,
  authorize("admin"),
  changeAdminPassword,
);
router.post(
  "/admin/logout-all",
  protect,
  authorize("admin"),
  logoutAdminSessions,
);
router
  .route("/admin/users")
  .get(protect, authorize("admin"), requirePermission("security:manage"), getAdminUsers)
  .post(protect, authorize("admin"), requirePermission("security:manage"), createAdminUser);
router.patch(
  "/admin/users/:id",
  protect,
  authorize("admin"),
  requirePermission("security:manage"),
  updateAdminUser,
);
router.get(
  "/admin/activity",
  protect,
  authorize("admin"),
  requirePermission("security:manage"),
  getAdminActivity,
);
router
  .route("/admin/riders")
  .get(protect, authorize("admin"), requirePermission("riders:manage"), getRiders)
  .post(
    protect,
    authorize("admin"),
    requirePermission("riders:manage"),
    auditActivity("rider.create", "rider"),
    createRider,
  );
router.patch(
  "/admin/riders/:id",
  protect,
  authorize("admin"),
  requirePermission("riders:manage"),
  auditActivity("rider.update", "rider"),
  updateRider,
);
export default router;
