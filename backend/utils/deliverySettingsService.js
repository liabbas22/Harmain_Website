import DeliverySettings from "../models/DeliverySettings.js";

const DEFAULT_KEY = "delivery";
const money = (value) => Math.max(0, Math.round(Number(value || 0) * 100) / 100);

const defaults = () => ({
  key: DEFAULT_KEY,
  isDeliveryEnabled: true,
  deliveryFee: money(process.env.DELIVERY_FEE || 0),
  freeDeliveryAbove: 0,
  estimatedMinutes: 45,
  note: "",
});

export const getDeliverySettings = async () => {
  const fallback = defaults();
  return DeliverySettings.findOneAndUpdate(
    { key: DEFAULT_KEY },
    { $setOnInsert: fallback },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const deliverySettingsSummary = (settings) => ({
  isDeliveryEnabled: settings.isDeliveryEnabled !== false,
  deliveryFee: money(settings.deliveryFee),
  freeDeliveryAbove: money(settings.freeDeliveryAbove),
  estimatedMinutes: Number(settings.estimatedMinutes || 0),
  note: settings.note || "",
  updatedAt: settings.updatedAt,
});

export const calculateDeliveryCharge = async (subtotal) => {
  const settings = await getDeliverySettings();
  const summary = deliverySettingsSummary(settings);
  const orderSubtotal = money(subtotal);
  const freeDeliveryAbove = summary.freeDeliveryAbove;
  const isFreeDelivery = freeDeliveryAbove > 0 && orderSubtotal >= freeDeliveryAbove;
  const deliveryFee = summary.isDeliveryEnabled && !isFreeDelivery ? summary.deliveryFee : 0;

  return {
    ...summary,
    deliveryFee: money(deliveryFee),
    isFreeDelivery,
    freeDeliveryRemaining: freeDeliveryAbove > 0 && !isFreeDelivery ? money(freeDeliveryAbove - orderSubtotal) : 0,
  };
};
