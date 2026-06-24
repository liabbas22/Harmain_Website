import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateTime, money } from "../../utils/format";

const offerLabel = (coupon) =>
  coupon.discountType === "percentage"
    ? `${coupon.value}% off${coupon.maxDiscount ? ` up to ${money(coupon.maxDiscount)}` : ""}`
    : `${money(coupon.value)} off`;

const couponState = (coupon) => {
  if (!coupon.isActive) return ["unavailable", "Inactive"];
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date())
    return ["failed", "Expired"];
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    return ["failed", "Limit reached"];
  return ["available", "Active"];
};

export default function CouponsPage({ coupons, onNew, onEdit, onDelete, busyAction }) {
  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Coupon codes</h2>
          <p className="mt-1 text-xs text-slate-500">Create controlled discounts for customer checkout.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={onNew}>Create coupon</Button>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <h3 className="text-base font-extrabold text-slate-900">Discount controls</h3>
          <p className="mt-1 text-xs text-slate-500">{coupons.length} coupon codes in this workspace</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse">
            <thead><tr className="h-11 border-b border-slate-200 bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500"><th className="px-4">Code</th><th className="px-4">Offer</th><th className="px-4">Rules</th><th className="px-4">Usage</th><th className="px-4">Validity</th><th className="px-4">Status</th><th className="px-4" /></tr></thead>
            <tbody>
              {coupons.map((coupon) => {
                const [state, stateLabel] = couponState(coupon);
                return <tr key={coupon._id} className="border-b border-slate-100 text-sm text-slate-700 last:border-0">
                  <td className="px-4 py-4"><strong className="inline-flex rounded-md bg-brand-50 px-2.5 py-1 font-mono text-xs text-brand-700">{coupon.code}</strong>{coupon.description && <small className="mt-2 block max-w-52 truncate text-[11px] text-slate-500">{coupon.description}</small>}</td>
                  <td className="px-4 py-4 font-extrabold text-slate-800">{offerLabel(coupon)}</td>
                  <td className="px-4 py-4 text-xs leading-5 text-slate-500"><span className="block">Min. {money(coupon.minimumOrder)}</span><span className="block">{coupon.perUserLimit > 0 ? `${coupon.perUserLimit} per customer` : "No customer limit"}</span></td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-700">{coupon.usedCount}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : " / unlimited"}</td>
                  <td className="px-4 py-4 text-xs leading-5 text-slate-500"><span className="block">Starts {dateTime(coupon.startsAt)}</span><span className="block">{coupon.expiresAt ? `Ends ${dateTime(coupon.expiresAt)}` : "No expiry"}</span></td>
                  <td className="px-4 py-4"><StatusBadge value={state} label={stateLabel} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-right"><Button variant="text" className="min-h-0 px-0 text-xs" onClick={() => onEdit(coupon)}>Edit</Button><Button variant="text" className="ml-3 min-h-0 px-0 text-xs text-red-700 hover:text-red-800" disabled={busyAction === `coupon-${coupon._id}`} onClick={() => onDelete(coupon)}>{busyAction === `coupon-${coupon._id}` ? "Deleting..." : "Delete"}</Button></td>
                </tr>;
              })}
              {!coupons.length && <tr><td colSpan="7" className="px-4 py-12 text-center text-sm text-slate-500">No coupon codes created yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
