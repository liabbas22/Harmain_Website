import HeroBanner from "../models/HeroBanner.js";
import asyncHandler from "../utils/asyncHandler.js";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const bannerPayload = (body = {}) => ({
  title: cleanString(body.title).slice(0, 90),
  subtitle: cleanString(body.subtitle).slice(0, 180),
  badge: cleanString(body.badge).slice(0, 40),
  image: cleanString(body.image),
  ctaLabel: cleanString(body.ctaLabel).slice(0, 40),
  ctaLink: cleanString(body.ctaLink),
  displayOrder: Math.max(0, Math.floor(Number(body.displayOrder || 0))),
  isActive: body.isActive !== false,
  startsAt: dateValue(body.startsAt),
  endsAt: dateValue(body.endsAt),
});

const publicBanner = (banner) => ({
  _id: banner._id,
  title: banner.title,
  subtitle: banner.subtitle,
  badge: banner.badge,
  image: banner.image,
  ctaLabel: banner.ctaLabel,
  ctaLink: banner.ctaLink,
  displayOrder: banner.displayOrder,
});

const activeWindowFilter = () => {
  const now = new Date();
  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
};

export const getActiveHeroBanners = asyncHandler(async (_req, res) => {
  const banners = await HeroBanner.find(activeWindowFilter())
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(10)
    .lean();
  res.json({ banners: banners.map(publicBanner) });
});

export const getHeroBannersForAdmin = asyncHandler(async (_req, res) => {
  const banners = await HeroBanner.find()
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();
  res.json({ banners });
});

export const createHeroBanner = asyncHandler(async (req, res) => {
  const payload = bannerPayload(req.body);
  if (!payload.image)
    return res.status(400).json({ message: "Banner image is required" });
  const banner = await HeroBanner.create(payload);
  res.status(201).json(banner);
});

export const updateHeroBanner = asyncHandler(async (req, res) => {
  const payload = bannerPayload(req.body);
  if (!payload.image)
    return res.status(400).json({ message: "Banner image is required" });
  const banner = await HeroBanner.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  res.json(banner);
});

export const deleteHeroBanner = asyncHandler(async (req, res) => {
  const banner = await HeroBanner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  res.json({ message: "Banner deleted" });
});
