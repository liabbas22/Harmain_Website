import DeliverySettings from "../models/DeliverySettings.js";

const DEFAULT_KEY = "delivery";
const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || "Asia/Karachi";
const DEFAULT_MINIMUM_ORDER = 500;

const money = (value) =>
  Math.max(0, Math.round(Number(value || 0) * 100) / 100);
const integer = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
};
const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeKey = (value) =>
  cleanString(value).toLowerCase().replace(/\s+/g, " ");
const timeValue = (value, fallback) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(cleanString(value))
    ? cleanString(value)
    : fallback;
const openDaysValue = (days) =>
  Array.isArray(days)
    ? [...new Set(days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    : [0, 1, 2, 3, 4, 5, 6];

const defaults = () => ({
  key: DEFAULT_KEY,
  isDeliveryEnabled: true,
  deliveryFee: money(process.env.DELIVERY_FEE || 0),
  freeDeliveryAbove: 0,
  minimumOrder: DEFAULT_MINIMUM_ORDER,
  estimatedMinutes: 45,
  note: "",
  branches: [
    {
      name: "Main Branch",
      code: "MAIN",
      phone: "",
      address: "",
      city: "Karachi",
      isActive: true,
      openingTime: "11:00",
      closingTime: "23:59",
      openDays: [0, 1, 2, 3, 4, 5, 6],
      zones: [
        {
          name: "Central Karachi",
          areas: ["Bahadurabad", "Gulshan", "Clifton", "Saddar", "Defence"],
          isActive: true,
          deliveryFee: money(process.env.DELIVERY_FEE || 0),
          minimumOrder: DEFAULT_MINIMUM_ORDER,
          freeDeliveryAbove: 0,
          estimatedMinutes: 45,
          note: "",
        },
      ],
    },
  ],
});

const branchIsOpen = (branch, at = new Date(), timeZone = BUSINESS_TIME_ZONE) => {
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(at);
  } catch {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(at);
  }
  const dayName = parts.find((part) => part.type === "weekday")?.value;
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dayName);
  const hour = parts.find((part) => part.type === "hour")?.value || "00";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";
  const currentMinutes = Number(hour) * 60 + Number(minute);
  const [openHour, openMinute] = (branch.openingTime || "00:00").split(":").map(Number);
  const [closeHour, closeMinute] = (branch.closingTime || "23:59").split(":").map(Number);
  const openingMinutes = openHour * 60 + openMinute;
  const closingMinutes = closeHour * 60 + closeMinute;
  const openDays = openDaysValue(branch.openDays);

  if (!openDays.includes(dayIndex)) return false;
  if (openingMinutes <= closingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
  }
  return currentMinutes >= openingMinutes || currentMinutes <= closingMinutes;
};

const zoneSummary = (zone) => ({
  _id: zone._id?.toString(),
  name: zone.name,
  areas: zone.areas || [],
  isActive: zone.isActive !== false,
  deliveryFee: money(zone.deliveryFee),
  minimumOrder: money(zone.minimumOrder ?? DEFAULT_MINIMUM_ORDER),
  freeDeliveryAbove: money(zone.freeDeliveryAbove),
  estimatedMinutes: integer(zone.estimatedMinutes, 45),
  note: zone.note || "",
});

const branchSummary = (branch) => ({
  _id: branch._id?.toString(),
  name: branch.name,
  code: branch.code || "",
  phone: branch.phone || "",
  address: branch.address || "",
  city: branch.city || "Karachi",
  isActive: branch.isActive !== false,
  openingTime: branch.openingTime || "11:00",
  closingTime: branch.closingTime || "23:59",
  openDays: openDaysValue(branch.openDays),
  isOpenNow: branch.isActive !== false && branchIsOpen(branch),
  zones: (branch.zones || []).map(zoneSummary),
});

const fallbackBranch = (settings) => ({
  _id: "default",
  name: "Default delivery",
  code: "DEFAULT",
  city: "Karachi",
  isActive: true,
  openingTime: "00:00",
  closingTime: "23:59",
  openDays: [0, 1, 2, 3, 4, 5, 6],
  zones: [
    {
      _id: "default",
      name: "All areas",
      areas: [],
      isActive: true,
      deliveryFee: money(settings.deliveryFee),
      minimumOrder: money(settings.minimumOrder ?? DEFAULT_MINIMUM_ORDER),
      freeDeliveryAbove: money(settings.freeDeliveryAbove),
      estimatedMinutes: integer(settings.estimatedMinutes, 45),
      note: settings.note || "",
    },
  ],
});

const findDeliveryZone = (settings, address = {}) => {
  const areaKey = normalizeKey(address.area);
  const cityKey = normalizeKey(address.city || "Karachi");
  const branches = (settings.branches || []).length
    ? (settings.branches || []).map(branchSummary)
    : [fallbackBranch(settings)];
  const activeBranches = branches.filter((branch) => branch.isActive);
  if (!activeBranches.length) return { branches, error: "No delivery branch is active right now." };

  const candidates = activeBranches
    .map((branch) => {
      const cityMatches = !cityKey || normalizeKey(branch.city) === cityKey;
      const zones = (branch.zones || []).filter((zone) => zone.isActive);
      const zone = zones.find((entry) =>
        !areaKey
          ? false
          : (entry.areas || []).map(normalizeKey).includes(areaKey),
      );
      return { branch, zone, cityMatches };
    })
    .filter(({ cityMatches }) => cityMatches);

  const matched = candidates.find(({ zone }) => zone);
  if (matched) return { branches, ...matched };

  const branchWithCatchAll = candidates.find(({ branch }) =>
    (branch.zones || []).some((zone) => zone.isActive && !zone.areas.length),
  );
  if (branchWithCatchAll) {
    return {
      branches,
      branch: branchWithCatchAll.branch,
      zone: branchWithCatchAll.branch.zones.find((zone) => zone.isActive && !zone.areas.length),
    };
  }

  if (!areaKey) return { branches, error: "Select a delivery area to calculate delivery." };
  return { branches, error: "Delivery is not available in this area." };
};

export const sanitizeDeliverySettings = (body = {}) => {
  const branches = (Array.isArray(body.branches) ? body.branches : [])
    .map((branch, index) => ({
      name: cleanString(branch.name) || `Branch ${index + 1}`,
      code: cleanString(branch.code || `BR${index + 1}`).toUpperCase(),
      phone: cleanString(branch.phone),
      address: cleanString(branch.address),
      city: cleanString(branch.city) || "Karachi",
      isActive: branch.isActive !== false,
      openingTime: timeValue(branch.openingTime, "11:00"),
      closingTime: timeValue(branch.closingTime, "23:59"),
      openDays: openDaysValue(branch.openDays),
      zones: (Array.isArray(branch.zones) ? branch.zones : [])
        .map((zone, zoneIndex) => ({
          name: cleanString(zone.name) || `Zone ${zoneIndex + 1}`,
          areas: [...new Set(
            (Array.isArray(zone.areas) ? zone.areas : String(zone.areas || "").split(","))
              .map(cleanString)
              .filter(Boolean),
          )],
          isActive: zone.isActive !== false,
          deliveryFee: money(zone.deliveryFee),
          minimumOrder: money(zone.minimumOrder ?? DEFAULT_MINIMUM_ORDER),
          freeDeliveryAbove: money(zone.freeDeliveryAbove),
          estimatedMinutes: integer(zone.estimatedMinutes, 45),
          note: cleanString(zone.note).slice(0, 160),
        }))
        .filter((zone) => zone.name),
    }))
    .filter((branch) => branch.name);

  return {
    isDeliveryEnabled: body.isDeliveryEnabled !== false,
    deliveryFee: money(body.deliveryFee),
    freeDeliveryAbove: money(body.freeDeliveryAbove),
    minimumOrder: money(body.minimumOrder ?? DEFAULT_MINIMUM_ORDER),
    estimatedMinutes: integer(body.estimatedMinutes, 45),
    note: cleanString(body.note).slice(0, 160),
    branches,
  };
};

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
  minimumOrder: money(settings.minimumOrder ?? DEFAULT_MINIMUM_ORDER),
  estimatedMinutes: integer(settings.estimatedMinutes, 45),
  note: settings.note || "",
  branches: (settings.branches || []).map(branchSummary),
  updatedAt: settings.updatedAt,
});

export const calculateDeliveryCharge = async (subtotal, address = {}) => {
  const settings = await getDeliverySettings();
  const summary = deliverySettingsSummary(settings);
  const orderSubtotal = money(subtotal);
  if (!summary.isDeliveryEnabled) {
    return {
      ...summary,
      deliveryFee: 0,
      selectedBranch: null,
      selectedZone: null,
      isFreeDelivery: false,
      isMinimumMet: false,
      freeDeliveryRemaining: 0,
      minimumOrderRemaining: 0,
      isDeliveryEnabled: false,
      message: "Delivery is currently unavailable.",
    };
  }

  const match = findDeliveryZone(settings, address);
  if (match.error) {
    return {
      ...summary,
      deliveryFee: 0,
      selectedBranch: null,
      selectedZone: null,
      isFreeDelivery: false,
      isMinimumMet: false,
      freeDeliveryRemaining: 0,
      minimumOrderRemaining: 0,
      isDeliveryEnabled: false,
      message: match.error,
    };
  }

  const { branch, zone } = match;
  if (!branchIsOpen(branch)) {
    return {
      ...summary,
      deliveryFee: 0,
      selectedBranch: branch,
      selectedZone: zone,
      isFreeDelivery: false,
      isMinimumMet: false,
      freeDeliveryRemaining: 0,
      minimumOrderRemaining: 0,
      isDeliveryEnabled: false,
      message: `${branch.name} is closed right now.`,
    };
  }

  const minimumOrder = money(zone.minimumOrder ?? summary.minimumOrder);
  const isMinimumMet = orderSubtotal >= minimumOrder;
  const freeDeliveryAbove = money(zone.freeDeliveryAbove);
  const isFreeDelivery =
    freeDeliveryAbove > 0 && orderSubtotal >= freeDeliveryAbove;
  const deliveryFee = isFreeDelivery ? 0 : money(zone.deliveryFee);

  return {
    ...summary,
    deliveryFee: money(deliveryFee),
    selectedBranch: branch,
    selectedZone: zone,
    minimumOrder,
    estimatedMinutes: integer(zone.estimatedMinutes, summary.estimatedMinutes),
    isFreeDelivery,
    isMinimumMet,
    freeDeliveryRemaining:
      freeDeliveryAbove > 0 && !isFreeDelivery
        ? money(freeDeliveryAbove - orderSubtotal)
        : 0,
    minimumOrderRemaining: !isMinimumMet
      ? money(minimumOrder - orderSubtotal)
      : 0,
    isDeliveryEnabled: true,
    message: zone.note || summary.note || "",
  };
};
