import Button from "../../components/ui/Button";
import { InlineLoadingBar, TableSkeleton } from "../../components/ui/LoadingStates";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateTime, money } from "../../utils/format";

const dealTypeLabel = (offer) => offer.dealType === "buy_x_get_y" ? "Buy X Get Y" : offer.dealType === "combo" ? "Combo deal" : "Discount";
const offerLabel = (offer) => {
  if (offer.dealType === "buy_x_get_y") return `Buy ${offer.buyQuantity || 1}, get ${offer.getQuantity || 1} free`;
  if (offer.dealType === "combo") return `Combo price ${money(offer.comboPrice)}`;
  return offer.discountType === "percentage" ? `${offer.value}% off${offer.maxDiscount ? ` up to ${money(offer.maxDiscount)}` : ""}` : `${money(offer.value)} off`;
};
const targetLabel = (offer) => {
  if (offer.dealType === "combo") return `${offer.products?.length || 0} product combo`;
  if (offer.appliesTo === "order") return "Whole order";
  if (offer.appliesTo === "category") return offer.category?.name || "Selected category";
  return `${offer.products?.length || 0} selected products`;
};
const offerState = (offer) => !offer.isActive ? ["unavailable", "Inactive"] : offer.expiresAt && new Date(offer.expiresAt) <= new Date() ? ["failed", "Expired"] : ["available", "Active"];

export default function OffersPage({ offers, loading, onNew, onEdit, onDelete, busyAction }) {
  const initialLoading = loading && !offers.length;

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Automatic offers</h2>
          <p className="mt-1 text-xs text-slate-500">Standard discounts, Buy X Get Y offers, and combo deals. Checkout keeps the customer's best saving.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={onNew}>Create offer</Button>
      </section>
      <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <h3 className="text-base font-extrabold text-slate-900">Live offers</h3>
          <p className="mt-1 text-xs text-slate-500">{offers.length} automatic offers in this workspace</p>
        </div>
        {initialLoading ? (
          <TableSkeleton rows={7} columns={8} minWidth="980px" />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="h-11 border-b border-slate-200 bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                <th className="px-4">Offer</th>
                <th className="px-4">Type</th>
                <th className="px-4">Deal</th>
                <th className="px-4">Applies to</th>
                <th className="px-4">Rules</th>
                <th className="px-4">Validity</th>
                <th className="px-4">Status</th>
                <th className="px-4" />
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const [state, label] = offerState(offer);
                return (
                  <tr key={offer._id} className="border-b border-slate-100 text-sm text-slate-700 last:border-0">
                    <td className="px-4 py-4">
                      <strong className="block text-sm text-slate-800">{offer.name}</strong>
                      {offer.description && <small className="mt-1 block max-w-52 truncate text-[11px] text-slate-500">{offer.description}</small>}
                    </td>
                    <td className="px-4 py-4 text-xs font-extrabold text-slate-700">{dealTypeLabel(offer)}</td>
                    <td className="px-4 py-4 font-extrabold text-slate-800">{offerLabel(offer)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-700">{targetLabel(offer)}</td>
                    <td className="px-4 py-4 text-xs leading-5 text-slate-500">
                      <span className="block">Min. {money(offer.minimumOrder)}</span>
                      <span className="block">Priority {offer.priority || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-slate-500">
                      <span className="block">Starts {dateTime(offer.startsAt)}</span>
                      <span className="block">{offer.expiresAt ? `Ends ${dateTime(offer.expiresAt)}` : "No expiry"}</span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge value={state} label={label} /></td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <Button variant="text" className="min-h-0 px-0 text-xs" onClick={() => onEdit(offer)}>Edit</Button>
                      <Button variant="text" className="ml-3 min-h-0 px-0 text-xs text-red-700 hover:text-red-800" disabled={busyAction === `offer-${offer._id}`} onClick={() => onDelete(offer)}>{busyAction === `offer-${offer._id}` ? "Deleting..." : "Delete"}</Button>
                    </td>
                  </tr>
                );
              })}
              {!offers.length && <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">No automatic offers created yet.</td></tr>}
            </tbody>
          </table>
          </div>
        )}
        {loading && !initialLoading && <InlineLoadingBar />}
      </section>
    </div>
  );
}
