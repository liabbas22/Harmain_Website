import { useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { CANCELLATION_REASONS, REFUND_STATUSES } from "../../constants/admin";
import { money, shortId } from "../../utils/format";

export default function CancelOrderModal({ order, onClose, onConfirm, busy }) {
  const [values, setValues] = useState(() => ({
    reason: order.cancellationReason || "customer_request",
    note: order.cancellationNote || "",
    refundStatus: order.refundStatus && order.refundStatus !== "not_required" ? order.refundStatus : order.paymentMethod === "card" ? "pending" : "not_required",
    refundAmount: String(order.refundAmount || (order.paymentMethod === "card" ? order.total : 0)),
    refundReference: order.refundReference || "",
  }));
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const refundRequired = values.refundStatus !== "not_required";
  const submit = (event) => {
    event.preventDefault();
    onConfirm({ orderStatus: "cancelled", cancellationReason: values.reason, cancellationNote: values.note, refundStatus: values.refundStatus, refundAmount: refundRequired ? Number(values.refundAmount || 0) : 0, refundReference: refundRequired ? values.refundReference : "" });
  };

  return <Modal title={`Cancel ${shortId(order._id)}`} onClose={onClose} size="max-w-2xl"><form className="p-4 sm:p-6" onSubmit={submit}><div className="border-l-4 border-brand-600 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700">This will cancel the order and record a permanent cancellation reason.</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Cancellation reason"><select className="field" value={values.reason} onChange={(event) => update("reason", event.target.value)}>{CANCELLATION_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Refund status"><select className="field" value={values.refundStatus} onChange={(event) => update("refundStatus", event.target.value)}>{REFUND_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Refund amount"><input className="field" type="number" min="0" step="1" value={values.refundAmount} disabled={!refundRequired} onChange={(event) => update("refundAmount", event.target.value)} placeholder={money(order.total)} /></Field><Field label="Refund reference"><input className="field" value={values.refundReference} disabled={!refundRequired} onChange={(event) => update("refundReference", event.target.value)} placeholder="Transaction or wallet reference" /></Field><Field label="Additional note" full><textarea className="field" rows="4" maxLength="500" value={values.note} onChange={(event) => update("note", event.target.value)} placeholder="Optional internal note" /></Field></div><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Keep order</Button><Button type="submit" variant="danger" disabled={busy}>{busy ? "Cancelling..." : "Cancel order"}</Button></div></form></Modal>;
}

function Field({ label, children, full = false }) {
  return <label className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>;
}
