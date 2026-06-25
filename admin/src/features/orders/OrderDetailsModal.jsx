import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ProductThumb from "../../components/ui/ProductThumb";
import StatusBadge from "../../components/ui/StatusBadge";
import { CANCELLATION_REASONS, REFUND_STATUSES } from "../../constants/admin";
import { dateTime, money, shortId, titleCase } from "../../utils/format";
import { printKitchenReceipt, printOrderInvoice } from "../../utils/orderPrint";

export default function OrderDetailsModal({
  order,
  riders = [],
  onAssignRider,
  assigning,
  onUpdateOrder,
  updatingOrder,
  onClose,
}) {
  const address = order.deliveryAddress || {};
  const addressLines = [
    address.line1,
    address.line2,
    address.area,
    address.city,
  ].filter(Boolean);
  const items = order.items || [];
  const assignedRider =
    order.assignedRider && typeof order.assignedRider === "object"
      ? order.assignedRider
      : null;
  const eligibleRiders = riders.filter(
    (rider) => rider.isActive || rider._id === assignedRider?._id,
  );
  const cancellationLabel = CANCELLATION_REASONS.find(
    ([value]) => value === order.cancellationReason,
  )?.[1];

  return (
    <Modal title={shortId(order._id)} onClose={onClose} size="max-w-3xl">
      <div className="p-4 sm:p-6">
        <section className="grid gap-3 p-4 border rounded-lg border-slate-200 bg-slate-50 sm:grid-cols-3">
          <div>
            <span className="block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Order status
            </span>
            <div className="mt-2">
              <StatusBadge value={order.orderStatus} />
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Payment
            </span>
            <b className="block mt-2 text-sm text-slate-800">
              {titleCase(order.paymentStatus || "pending")}
            </b>
          </div>
          <div>
            <span className="block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Placed
            </span>
            <b className="block mt-2 text-sm text-slate-800">
              {dateTime(order.createdAt)}
            </b>
          </div>
        </section>
        <section className="grid gap-4 mt-5 md:grid-cols-2">
          <div className="p-4 border rounded-lg border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900">Customer</h3>
            <p className="mt-3 text-sm font-bold text-slate-800">
              {order.user?.name || address.fullName || "Customer"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {order.user?.email || "No email available"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {address.phone || "No phone available"}
            </p>
          </div>
          <div className="p-4 border rounded-lg border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900">
              Delivery address
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              {address.fullName || "-"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {addressLines.length
                ? addressLines.join(", ")
                : "No delivery address available"}
            </p>
            {address.instructions && (
              <p className="mt-3 text-sm text-amber-700">
                Note: {address.instructions}
              </p>
            )}
          </div>
        </section>
        <section className="mt-5 grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_240px]">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Delivery assignment
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {assignedRider
                ? `${assignedRider.name}${assignedRider.phone ? ` | ${assignedRider.phone}` : ""}`
                : "No rider has been assigned yet."}
            </p>
            {order.assignedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Assigned {dateTime(order.assignedAt)}
              </p>
            )}
          </div>
          <label className="grid gap-2 text-xs font-extrabold tracking-wide uppercase text-slate-500">
            <span>Assigned rider</span>
            <select
              className="field"
              value={assignedRider?._id || ""}
              disabled={assigning || order.orderStatus === "cancelled"}
              onChange={(event) =>
                onAssignRider?.(order._id, event.target.value)
              }
            >
              <option value="">Unassigned</option>
              {eligibleRiders.map((rider) => (
                <option key={rider._id} value={rider._id}>
                  {rider.name}
                  {rider.phone ? ` - ${rider.phone}` : ""}
                </option>
              ))}
            </select>
          </label>
        </section>
        {order.orderStatus === "cancelled" && (
          <section className="mt-5 grid gap-4 rounded-lg border border-red-200 bg-red-50/40 p-4 sm:grid-cols-[1fr_240px]">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Cancellation and refund
              </h3>
              <p className="mt-2 text-sm font-bold text-slate-700">
                {cancellationLabel || "Cancellation reason not recorded"}
              </p>
              {order.cancellationNote && (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {order.cancellationNote}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Refund amount: {money(order.refundAmount)}
                {order.refundReference ? ` | ${order.refundReference}` : ""}
              </p>
            </div>
            <label className="grid gap-2 text-xs font-extrabold tracking-wide uppercase text-slate-500">
              <span>Refund status</span>
              <select
                className="field"
                value={order.refundStatus || "not_required"}
                disabled={updatingOrder}
                onChange={(event) =>
                  onUpdateOrder?.(order._id, {
                    refundStatus: event.target.value,
                  })
                }
              >
                {REFUND_STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}
        <section className="mt-5 overflow-hidden border rounded-lg border-slate-200">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900">
              Items ordered
            </h3>
            <span className="text-xs font-extrabold text-slate-500">
              {items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}{" "}
              items
            </span>
          </div>
          {items.map((item, index) => (
            <article
              className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
              key={`${item.product || item.name}-${index}`}
            >
              <ProductThumb
                image={item.image}
                name={item.name}
                className="h-[42px] w-[42px]"
              />
              <div className="min-w-0">
                <strong className="block text-sm truncate text-slate-800">
                  {item.name || "Menu item"}
                </strong>
                {item.optionName && (
                  <small className="block mt-1 text-xs text-slate-500">
                    {item.optionName} x{item.quantity}
                  </small>
                )}
                {item.specialInstructions && (
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Note: {item.specialInstructions}
                  </p>
                )}
              </div>
              <b className="text-sm text-right text-slate-800">
                {money(Number(item.price || 0) * Number(item.quantity || 0))}
              </b>
            </article>
          ))}
        </section>
        <section className="ml-auto mt-5 grid w-full max-w-[280px] grid-cols-[1fr_auto] gap-x-6 gap-y-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
          <span>Subtotal</span>
          <b className="text-right text-slate-800">{money(order.subtotal)}</b>
          {Number(order.discount) > 0 && <><span>{order.coupon?.code ? `Coupon (${order.coupon.code})` : order.offer?.name ? `Offer (${order.offer.name})` : "Discount"}</span><b className="text-right text-emerald-700">- {money(order.discount)}</b></>}
          <span>Delivery fee</span>
          <b className="text-right text-slate-800">
            {money(order.deliveryFee)}
          </b>
          <strong className="pt-2 text-base text-slate-900">Grand total</strong>
          <strong className="pt-2 text-base text-right text-brand-700">
            {money(order.total)}
          </strong>
        </section>
        <section className="flex flex-col-reverse gap-3 pt-5 mt-6 border-t border-slate-200 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            className="h-10 px-4"
            onClick={() => printKitchenReceipt(order)}
          >
            Kitchen receipt
          </Button>
          <Button
            className="h-10 px-4"
            onClick={() => printOrderInvoice(order)}
          >
            Print invoice
          </Button>
        </section>
      </div>
    </Modal>
  );
}
