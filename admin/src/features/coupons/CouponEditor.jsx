import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const Field = ({ label, children, full = false, hint }) => (
  <label className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}>
    <span>{label}</span>
    {children}
    {hint && <small className="text-[11px] font-medium text-slate-500">{hint}</small>}
  </label>
);

export default function CouponEditor({ editor, onChange, onClose, onSave, busy }) {
  const { values } = editor;
  const update = (key, value) => onChange({ ...editor, values: { ...values, [key]: value } });

  return (
    <Modal title={editor.id ? "Edit coupon" : "Create coupon"} onClose={onClose} size="max-w-3xl">
      <form className="p-4 sm:p-6" onSubmit={onSave}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coupon code" hint="Uppercase letters, numbers, hyphens and underscores only.">
            <input className="field font-mono uppercase" value={values.code} onChange={(event) => update("code", event.target.value.toUpperCase())} maxLength="24" placeholder="WELCOME10" required />
          </Field>
          <Field label="Discount type">
            <select className="field" value={values.discountType} onChange={(event) => update("discountType", event.target.value)}><option value="percentage">Percentage discount</option><option value="fixed">Fixed amount</option></select>
          </Field>
          <Field label={values.discountType === "percentage" ? "Discount percentage" : "Discount amount"}>
            <input className="field" type="number" min="0.01" max={values.discountType === "percentage" ? "100" : undefined} step="0.01" value={values.value} onChange={(event) => update("value", event.target.value)} required />
          </Field>
          <Field label="Minimum order amount">
            <input className="field" type="number" min="0" step="1" value={values.minimumOrder} onChange={(event) => update("minimumOrder", event.target.value)} required />
          </Field>
          {values.discountType === "percentage" && <Field label="Maximum discount" hint="Leave empty for no cap."><input className="field" type="number" min="0.01" step="0.01" value={values.maxDiscount} onChange={(event) => update("maxDiscount", event.target.value)} /></Field>}
          <Field label="Total usage limit" hint="Use 0 for unlimited uses."><input className="field" type="number" min="0" step="1" value={values.usageLimit} onChange={(event) => update("usageLimit", event.target.value)} required /></Field>
          <Field label="Per-customer limit" hint="Use 0 to allow unlimited use per customer."><input className="field" type="number" min="0" step="1" value={values.perUserLimit} onChange={(event) => update("perUserLimit", event.target.value)} required /></Field>
          <Field label="Starts at"><input className="field" type="datetime-local" value={values.startsAt} onChange={(event) => update("startsAt", event.target.value)} required /></Field>
          <Field label="Expires at" hint="Leave empty for no expiry."><input className="field" type="datetime-local" value={values.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} /></Field>
          <Field label="Internal description" full><textarea className="field" rows="3" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Shown only in the admin workspace." maxLength="160" /></Field>
          <label className="col-span-full flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700"><input className="h-4 w-4 accent-brand-600" checked={values.isActive} onChange={(event) => update("isActive", event.target.checked)} type="checkbox" />Allow customers to use this coupon</label>
        </div>
        <div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save coupon"}</Button></div>
      </form>
    </Modal>
  );
}
