import mongoose from "mongoose";

const deliverySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "delivery", unique: true, immutable: true },
    isDeliveryEnabled: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 0, min: 0 },
    freeDeliveryAbove: { type: Number, default: 0, min: 0 },
    estimatedMinutes: { type: Number, default: 45, min: 0 },
    note: { type: String, default: "", trim: true, maxlength: 160 },
  },
  { timestamps: true },
);

export default mongoose.models.DeliverySettings || mongoose.model("DeliverySettings", deliverySettingsSchema);
