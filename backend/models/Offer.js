import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 160 },
    dealType: { type: String, enum: ["discount", "buy_x_get_y", "combo"], default: "discount" },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    value: { type: Number, default: 0, min: 0 },
    appliesTo: { type: String, enum: ["order", "category", "products"], default: "order" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    products: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], default: [] },
    buyQuantity: { type: Number, default: 1, min: 1 },
    getQuantity: { type: Number, default: 1, min: 1 },
    comboPrice: { type: Number, default: 0, min: 0 },
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
