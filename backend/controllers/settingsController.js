import asyncHandler from "../utils/asyncHandler.js";
import { deliverySettingsSummary, getDeliverySettings } from "../utils/deliverySettingsService.js";

const requestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const numberValue = (value, label, { min = 0, integer = false } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed))) throw requestError(`${label} is invalid.`);
  return parsed;
};

export const getDeliverySettingsForAdmin = asyncHandler(async (_req, res) => {
  const settings = await getDeliverySettings();
  res.json(deliverySettingsSummary(settings));
});

export const updateDeliverySettings = asyncHandler(async (req, res) => {
  const settings = await getDeliverySettings();
  settings.isDeliveryEnabled = req.body.isDeliveryEnabled !== false;
  settings.deliveryFee = numberValue(req.body.deliveryFee ?? 0, "Delivery fee");
  settings.freeDeliveryAbove = numberValue(req.body.freeDeliveryAbove ?? 0, "Free delivery amount");
  settings.estimatedMinutes = numberValue(req.body.estimatedMinutes ?? 45, "Estimated delivery time", { integer: true });
  settings.note = typeof req.body.note === "string" ? req.body.note.trim() : "";
  await settings.save();
  res.json(deliverySettingsSummary(settings));
});
