import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 160 },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0.01 },
    appliesTo: { type: String, enum: ["order", "category", "products"], default: "order" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    products: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], default: [] },
    minimumOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    priority: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

offerSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1, priority: -1 });

export default mongoose.models.Offer || mongoose.model("Offer", offerSchema);
