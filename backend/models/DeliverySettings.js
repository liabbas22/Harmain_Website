import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    areas: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 0, min: 0 },
    minimumOrder: { type: Number, default: 500, min: 0 },
    freeDeliveryAbove: { type: Number, default: 0, min: 0 },
    estimatedMinutes: { type: Number, default: 45, min: 0 },
    note: { type: String, default: "", trim: true, maxlength: 160 },
  },
  { _id: true },
);

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "", trim: true, uppercase: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "Karachi", trim: true },
    isActive: { type: Boolean, default: true },
    openingTime: {
      type: String,
      default: "11:00",
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Opening time is invalid"],
    },
    closingTime: {
      type: String,
      default: "23:59",
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Closing time is invalid"],
    },
    openDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator: (days) =>
          days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6),
        message: "Open days are invalid",
      },
    },
    zones: { type: [zoneSchema], default: [] },
  },
  { _id: true },
);

const deliverySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "delivery", unique: true, immutable: true },
    isDeliveryEnabled: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 0, min: 0 },
    freeDeliveryAbove: { type: Number, default: 0, min: 0 },
    minimumOrder: { type: Number, default: 500, min: 0 },
    estimatedMinutes: { type: Number, default: 45, min: 0 },
    note: { type: String, default: "", trim: true, maxlength: 160 },
    branches: { type: [branchSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.DeliverySettings ||
  mongoose.model("DeliverySettings", deliverySettingsSchema);
