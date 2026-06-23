import { titleCase } from "../../utils/format";

const colors = {
  available: "bg-emerald-50 text-emerald-700",
  unavailable: "bg-red-50 text-red-700",
  placed: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  preparing: "bg-blue-50 text-blue-700",
  out_for_delivery: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
};

export default function StatusBadge({ value, label }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-3 pt-0.5 text-[11px] font-extrabold ${colors[value] || "bg-slate-100 text-slate-700"}`}
    >
      {label || titleCase(value)}
    </span>
  );
}
