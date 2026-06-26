import React, { useEffect, useMemo, useState } from "react";

const formatOfferValue = (offer) => {
  if (!offer) return "";
  if (offer.label) return offer.label;
  if (offer.dealType === "buy_x_get_y")
    return `Buy ${offer.buyQuantity || 1} Get ${offer.getQuantity || 1}`;
  if (offer.dealType === "combo") return "Combo Deal";
  if (offer.discountType === "percentage")
    return `${Number(offer.value || 0)}% OFF`;
  return `Rs. ${Number(offer.value || 0)} OFF`;
};

const formatTimeLeft = (expiresAt, now) => {
  if (!expiresAt) return "Limited time";
  const endTime = new Date(expiresAt).getTime();
  if (!Number.isFinite(endTime)) return "Limited time";

  const diff = endTime - now;
  if (diff <= 0) return "";

  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (days > 0) return `Ends in ${days}d ${hours}h`;
  if (hours > 0) return `Ends in ${hours}h ${minutes}m`;
  return `Ends in ${minutes}m ${remainingSeconds}s`;
};

const OfferBadge = ({ offer, className = "", compact = false }) => {
  const expiryTime = useMemo(
    () => (offer?.expiresAt ? new Date(offer.expiresAt).getTime() : null),
    [offer?.expiresAt],
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiryTime) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiryTime]);

  if (!offer) return null;

  const timeLeft = formatTimeLeft(offer.expiresAt, now);
  if (offer.expiresAt && !timeLeft) return null;

  return (
    <div
      className={`inline-flex max-w-[12rem] items-center overflow-hidden rounded-full bg-red-700 text-white shadow-lg ring-1 ring-white/50 ${className}`}
    >
      <span
        className={`${compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"} font-extrabold uppercase tracking-wide`}
      >
        {formatOfferValue(offer)}
      </span>
      <span
        className={`${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[11px]"} border-l border-white/25 bg-white/15 font-bold whitespace-nowrap`}
      >
        {timeLeft}
      </span>
    </div>
  );
};

export default OfferBadge;
