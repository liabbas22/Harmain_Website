import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "", maxlength: 90 },
    subtitle: { type: String, trim: true, default: "", maxlength: 180 },
    badge: { type: String, trim: true, default: "", maxlength: 40 },
    image: { type: String, required: true, trim: true },
    ctaLabel: { type: String, trim: true, default: "", maxlength: 40 },
    ctaLink: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

heroBannerSchema.index({ isActive: -1, displayOrder: 1, createdAt: -1 });

const HeroBanner =
  mongoose.models.HeroBanner || mongoose.model("HeroBanner", heroBannerSchema);

export default HeroBanner;
