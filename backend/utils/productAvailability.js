const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || "Asia/Karachi";

const timeToMinutes = (value = "") => {
  const match = String(value).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const partsInTimeZone = (date, timeZone) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

const dayIndex = (weekday) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);

const withinWindow = ({ nowMinutes, startMinutes, endMinutes }) => {
  if (startMinutes === null || endMinutes === null) return true;
  if (startMinutes === endMinutes) return true;
  if (startMinutes < endMinutes)
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
};

const scheduleText = (schedule = {}) => {
  if (!schedule.startTime || !schedule.endTime) return "at its scheduled time";
  return `from ${schedule.startTime} to ${schedule.endTime}`;
};

export const productAvailability = (product, now = new Date()) => {
  if (!product) {
    return {
      isManuallyAvailable: false,
      isTimeAvailable: false,
      isOrderable: false,
      unavailableReason: "Product not found",
    };
  }

  const isManuallyAvailable = product.isAvailable !== false;
  if (!isManuallyAvailable) {
    return {
      isManuallyAvailable,
      isTimeAvailable: true,
      isOrderable: false,
      unavailableReason: "Unavailable",
    };
  }

  const schedule = product.availabilitySchedule || {};
  if (!schedule.isEnabled) {
    return {
      isManuallyAvailable,
      isTimeAvailable: true,
      isOrderable: true,
      unavailableReason: "",
    };
  }

  let parts;
  try {
    parts = partsInTimeZone(now, BUSINESS_TIME_ZONE);
  } catch {
    parts = partsInTimeZone(now, "UTC");
  }

  const currentDay = dayIndex(parts.weekday);
  const allowedDays = Array.isArray(schedule.days) ? schedule.days : [];
  const dayAllowed =
    !allowedDays.length || allowedDays.map(Number).includes(currentDay);
  const nowMinutes =
    Number(parts.hour === "24" ? 0 : parts.hour) * 60 + Number(parts.minute);
  const timeAllowed = withinWindow({
    nowMinutes,
    startMinutes: timeToMinutes(schedule.startTime),
    endMinutes: timeToMinutes(schedule.endTime),
  });
  const isTimeAvailable = dayAllowed && timeAllowed;

  return {
    isManuallyAvailable,
    isTimeAvailable,
    isOrderable: isTimeAvailable,
    unavailableReason: isTimeAvailable
      ? ""
      : schedule.message ||
        `Available ${scheduleText(schedule)}`,
  };
};

export const productPayloadWithAvailability = (product) => {
  const entry = product?.toObject ? product.toObject() : product;
  const availability = productAvailability(entry);
  return {
    ...entry,
    isTimeAvailable: availability.isTimeAvailable,
    isOrderable: availability.isOrderable,
    unavailableReason: availability.unavailableReason,
  };
};
