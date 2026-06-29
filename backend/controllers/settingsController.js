import asyncHandler from "../utils/asyncHandler.js";
import {
  deliverySettingsSummary,
  getDeliverySettings,
  sanitizeDeliverySettings,
} from "../utils/deliverySettingsService.js";

export const getDeliverySettingsForAdmin = asyncHandler(async (_req, res) => {
  const settings = await getDeliverySettings();
  res.json(deliverySettingsSummary(settings));
});

export const updateDeliverySettings = asyncHandler(async (req, res) => {
  const settings = await getDeliverySettings();
  Object.assign(settings, sanitizeDeliverySettings(req.body));
  await settings.save();
  res.json(deliverySettingsSummary(settings));
});
