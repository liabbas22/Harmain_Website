import mongoose from "mongoose";
const addOnSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);
const cartItemSchema = new mongoose.Schema({ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, optionName: { type: String, default: "" }, specialInstructions: { type: String, default: "", trim: true, maxlength: 500 }, addOns: { type: [addOnSnapshotSchema], default: [] }, addOnsKey: { type: String, default: "" }, unitPrice: { type: Number, required: true, min: 0 }, quantity: { type: Number, required: true, min: 1, default: 1 } }, { _id: false });
const cartSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, items: { type: [cartItemSchema], default: [] } }, { timestamps: true });
export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
