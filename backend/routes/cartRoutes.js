import express from "express";
import { addItem, clearCart, getUserCart, removeItem, updateItem } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.route("/").get(getUserCart).post(addItem).delete(clearCart);
router.route("/:productId").patch(updateItem).delete(removeItem);
export default router;
