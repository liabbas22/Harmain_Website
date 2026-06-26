import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { money } from "../../utils/format";

const Field = ({ label, hint, children }) => (
  <label className="grid gap-2 text-sm font-bold text-slate-700">
    <span>{label}</span>
    {children}
    {hint && <small className="text-[11px] font-medium leading-5 text-slate-500">{hint}</small>}
  </label>
);

const toForm = (settings) => ({
  isDeliveryEnabled: settings?.isDeliveryEnabled !== false,
  deliveryFee: String(settings?.deliveryFee ?? 0),
  freeDeliveryAbove: String(settings?.freeDeliveryAbove ?? 0),
  estimatedMinutes: String(settings?.estimatedMinutes ?? 45),
  note: settings?.note || "",
});

export default function DeliverySettingsPage({ settings, loading, onSave, busy }) {
  const [values, setValues] = useState(() => toForm(settings));
  useEffect(() => setValues(toForm(settings)), [settings]);
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const deliveryFee = Number(values.deliveryFee || 0);
  const freeDeliveryAbove = Number(values.freeDeliveryAbove || 0);

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Delivery settings</h2>
          <p className="mt-1 text-xs text-slate-500">Control checkout delivery fee, free delivery threshold, and delivery availability.</p>
        </div>
        <div className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${values.isDeliveryEnabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {values.isDeliveryEnabled ? "Delivery enabled" : "Delivery paused"}
        </div>
      </section>

      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); onSave(values); }}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="col-span-full flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <span>
                <span className="block text-slate-900">Accept delivery orders</span>
                <small className="mt-1 block text-[11px] font-medium text-slate-500">Turn this off only when delivery is temporarily unavailable.</small>
              </span>
              <input className="h-5 w-5 accent-brand-600" checked={values.isDeliveryEnabled} onChange={(event) => update("isDeliveryEnabled", event.target.checked)} type="checkbox" />
            </label>
            <Field label="Delivery fee" hint="Charged when the order is below the free delivery threshold.">
              <input className="field" type="number" min="0" step="1" value={values.deliveryFee} onChange={(event) => update("deliveryFee", event.target.value)} required />
            </Field>
            <Field label="Free delivery above" hint="Set 0 to disable free delivery. Threshold is checked against food subtotal before discounts.">
              <input className="field" type="number" min="0" step="1" value={values.freeDeliveryAbove} onChange={(event) => update("freeDeliveryAbove", event.target.value)} required />
            </Field>
            <Field label="Estimated delivery time" hint="Shown on checkout in minutes.">
              <input className="field" type="number" min="0" step="1" value={values.estimatedMinutes} onChange={(event) => update("estimatedMinutes", event.target.value)} required />
            </Field>
            <Field label="Customer note" hint="Optional short note for operations or checkout context.">
              <input className="field" maxLength="160" value={values.note} onChange={(event) => update("note", event.target.value)} placeholder="Delivery available in selected areas" />
            </Field>
          </section>

          <aside className="rounded-lg border border-red-100 bg-red-50/60 p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Checkout preview</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Delivery fee</span>
                <b className="text-slate-900">{values.isDeliveryEnabled ? money(deliveryFee) : "Paused"}</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Free delivery</span>
                <b className="text-slate-900">{freeDeliveryAbove > 0 ? `Above ${money(freeDeliveryAbove)}` : "Disabled"}</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ETA</span>
                <b className="text-slate-900">{Number(values.estimatedMinutes || 0)} min</b>
              </div>
            </div>
            <p className="mt-4 rounded-md bg-white px-3 py-2 text-xs leading-5 text-slate-500">
              Orders keep their delivery fee snapshot, so old invoices stay correct after settings change.
            </p>
          </aside>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <span className="text-xs text-slate-500">{loading ? "Loading settings..." : settings?.updatedAt ? `Last updated ${new Date(settings.updatedAt).toLocaleString()}` : "Ready to save"}</span>
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save delivery settings"}</Button>
        </div>
      </form>
    </div>
  );
}
