import { ORDER_STATUSES, PAYMENT_STATUSES } from "../../constants/admin";
import { dateTime, money, shortId, titleCase } from "../../utils/format";
import StatusBadge from "../../components/ui/StatusBadge";

export default function OrderTable({
  orders,
  compact = false,
  busyAction,
  onCancel,
  onOpenOrder,
  onUpdate,
}) {
  const openFromRow = (event, order) => {
    if (!event.target.closest("select")) onOpenOrder?.(order);
  };

  return (
    <table className="w-full min-w-[840px] border-collapse">
      <thead>
        <tr className="h-11 border-b border-slate-200 bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          <th className="px-4">Order</th>
          <th className="px-4">Customer</th>
          {!compact && <th className="px-4">Items</th>}
          <th className="px-4">Total</th>
          {!compact && <th className="px-4">Rider</th>}
          <th className="px-4">Status</th>
          {!compact && <th className="px-4">Payment</th>}
          <th className="px-4">Created</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order._id}
            tabIndex="0"
            onClick={(event) => openFromRow(event, order)}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onOpenOrder?.(order);
              }
            }}
            className="text-sm transition border-b outline-none cursor-pointer border-slate-100 text-slate-700 hover:bg-red-50 focus:bg-red-50 focus:ring-2 focus:ring-inset focus:ring-brand-600"
          >
            <td className="px-4 py-3 font-extrabold text-slate-800">
              {shortId(order._id)}
            </td>
            <td className="px-4 py-3">
              <strong className="block text-sm text-slate-800">
                {order.user?.name ||
                  order.deliveryAddress?.fullName ||
                  "Customer"}
              </strong>
              <small className="mt-1 block max-w-[210px] truncate text-[11px] text-slate-500">
                {order.user?.email || order.deliveryAddress?.phone || "-"}
              </small>
            </td>
            {!compact && (
              <td className="px-4 py-3">
                {order.items?.reduce((sum, item) => sum + item.quantity, 0) ||
                  0}{" "}
                items
              </td>
            )}
            <td className="px-4 py-3 font-extrabold text-slate-800">
              {money(order.total)}
            </td>
            {!compact && (
              <td className="px-4 py-3">
                {order.assignedRider?.name ? (
                  <>
                    <strong className="block text-sm text-slate-800">
                      {order.assignedRider.name}
                    </strong>
                    <small className="mt-1 block text-[11px] text-slate-500">
                      {order.assignedRider.phone || "Assigned"}
                    </small>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Unassigned
                  </span>
                )}
              </td>
            )}
            <td className="px-4 py-3">
              {compact ? (
                <StatusBadge value={order.orderStatus} />
              ) : (
                <select
                  className="h-10 px-3 text-sm bg-white border rounded-md outline-none border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                  value={order.orderStatus}
                  disabled={busyAction === `order-${order._id}`}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    if (nextStatus === "cancelled") onCancel?.(order);
                    else onUpdate(order._id, { orderStatus: nextStatus });
                  }}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {titleCase(status)}
                    </option>
                  ))}
                </select>
              )}
            </td>
            {!compact && (
              <td className="px-4 py-3">
                <select
                  className="h-10 px-3 text-sm bg-white border rounded-md outline-none border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                  value={order.paymentStatus}
                  disabled={busyAction === `order-${order._id}`}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    onUpdate(order._id, { paymentStatus: event.target.value })
                  }
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {titleCase(status)}
                    </option>
                  ))}
                </select>
              </td>
            )}
            <td className="px-4 py-3 text-xs text-slate-500">
              {dateTime(order.createdAt)}
            </td>
          </tr>
        ))}
        {!orders.length && (
          <tr>
            <td
              colSpan={compact ? 5 : 8}
              className="px-4 py-12 text-sm text-center text-slate-500"
            >
              No orders are available yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
