import { REPORT_RANGES } from "../../constants/admin";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateTime, money, shortId, titleCase } from "../../utils/format";

const safeList = (value) => (Array.isArray(value) ? value : []);

const percent = (value, total) =>
  total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0;

const itemName = (item) =>
  [item.name || "Menu item", item.optionName].filter(Boolean).join(" | ");

function MetricCard({ label, value, caption, accent = false }) {
  return (
    <article className="min-h-32 rounded-lg border border-slate-200 bg-white p-5">
      <span className="text-xs font-extrabold text-slate-500">{label}</span>
      <strong className={`my-4 block text-3xl font-extrabold ${accent ? "text-brand-700" : "text-slate-900"}`}>
        {value}
      </strong>
      <small className="text-xs text-slate-500">{caption}</small>
    </article>
  );
}

function SectionHeader({ title, caption }) {
  return (
    <div className="border-b border-slate-100 px-5 py-5">
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function EmptyState({ label }) {
  return <p className="p-5 text-sm text-slate-500">{label}</p>;
}

function SalesBucket({ title, rows }) {
  const salesRows = safeList(rows);
  const maxRevenue = Math.max(...salesRows.map((row) => Number(row.revenue || 0)), 1);

  return (
    <article className="grid h-[360px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white">
      <SectionHeader title={title} caption="Sales, discounts, and order count" />
      {salesRows.length ? (
        <div className="grid content-start gap-3 overflow-y-auto overscroll-contain p-5">
          {salesRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-3 text-xs">
              <span className="font-bold text-slate-600">{row.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full min-w-[3px] rounded-full bg-brand-600"
                  style={{ width: `${percent(row.revenue, maxRevenue)}%` }}
                />
              </div>
              <div className="text-right">
                <b className="block text-slate-900">{money(row.revenue)}</b>
                <small className="text-slate-500">{row.orders} orders</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState label="No sales found in this period." />
      )}
    </article>
  );
}

function BestSellingTable({ rows }) {
  const items = safeList(rows);
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <SectionHeader title="Best-selling items" caption="Ranked by total prepared quantity" />
      {items.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3 text-right">Units</th>
                <th className="px-5 py-3 text-right">Paid</th>
                <th className="px-5 py-3 text-right">Free</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={`${item.product || item.name}-${item.optionName || "regular"}`}>
                  <td className="px-5 py-4 font-extrabold text-slate-800">{itemName(item)}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-700">{item.quantity}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{item.paidQuantity}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{item.freeQuantity}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{item.orderCount}</td>
                  <td className="px-5 py-4 text-right font-extrabold text-slate-900">{money(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState label="No item sales found in this period." />
      )}
    </article>
  );
}

function PaymentReport({ payments }) {
  const byStatus = safeList(payments?.byStatus);
  const byMethod = safeList(payments?.byMethod);
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <SectionHeader title="Payment status" caption="Pending, paid, failed, and refunded totals" />
        {byStatus.length ? (
          <div className="divide-y divide-slate-100">
            {byStatus.map((entry) => (
              <div key={entry.status || "unknown"} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4">
                <div>
                  <StatusBadge value={entry.status || "pending"} label={titleCase(entry.status || "pending")} />
                  <p className="mt-2 text-xs text-slate-500">{entry.orders} orders</p>
                </div>
                <div className="text-right">
                  <b className="block text-sm text-slate-900">{money(entry.amount)}</b>
                  <small className="text-slate-500">Refunds {money(entry.refunds)}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No payment records found." />
        )}
      </article>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <SectionHeader title="Payment methods" caption="Collection split by payment method" />
        {byMethod.length ? (
          <div className="divide-y divide-slate-100">
            {byMethod.map((entry) => (
              <div key={entry.method || "unknown"} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4">
                <div>
                  <b className="block text-sm text-slate-800">{titleCase(entry.method || "unknown")}</b>
                  <small className="text-slate-500">{entry.orders} orders</small>
                </div>
                <div className="text-right">
                  <b className="block text-sm text-slate-900">{money(entry.amount)}</b>
                  <small className="text-slate-500">Paid {money(entry.paid)} | Pending {money(entry.pending)}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No payment methods found." />
        )}
      </article>
    </section>
  );
}

function CancellationReport({ data }) {
  const reasons = safeList(data?.byReason);
  const refundStatuses = safeList(data?.byRefundStatus);
  const recentOrders = safeList(data?.recentOrders);

  return (
    <section className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <SectionHeader title="Cancelled orders report" caption="Reasons and refund exposure" />
        {reasons.length ? (
          <div className="divide-y divide-slate-100">
            {reasons.map((entry) => (
              <div key={entry.reason || "other"} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4">
                <div>
                  <b className="block text-sm text-slate-800">{titleCase(entry.reason || "other")}</b>
                  <small className="text-slate-500">{entry.orders} cancellations</small>
                </div>
                <div className="text-right">
                  <b className="block text-sm text-brand-700">{money(entry.lostSales)}</b>
                  <small className="text-slate-500">Refund {money(entry.refundAmount)}</small>
                </div>
              </div>
            ))}
            {refundStatuses.length > 0 && (
              <div className="bg-slate-50 px-5 py-4">
                <b className="text-xs uppercase tracking-wide text-slate-500">Refund status</b>
                <div className="mt-3 flex flex-wrap gap-2">
                  {refundStatuses.map((entry) => (
                    <span key={entry.status || "none"} className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
                      {titleCase(entry.status || "not_required")}: {entry.orders} / {money(entry.amount)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState label="No cancelled orders in this period." />
        )}
      </article>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <SectionHeader title="Recent cancellations" caption="Latest cancelled orders for follow-up" />
        {recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Refund</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-5 py-4 font-extrabold text-slate-800">{shortId(order._id)}</td>
                    <td className="px-5 py-4 text-slate-600">{order.user?.name || order.deliveryAddress?.fullName || "Customer"}</td>
                    <td className="px-5 py-4 text-slate-600">{titleCase(order.cancellationReason || "other")}</td>
                    <td className="px-5 py-4 text-slate-600">{titleCase(order.refundStatus || "not_required")}</td>
                    <td className="px-5 py-4 text-right font-extrabold text-slate-900">{money(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No recent cancellations to review." />
        )}
      </article>
    </section>
  );
}

function StockUsageReport({ rows }) {
  const items = safeList(rows);
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <SectionHeader title="Stock usage report" caption="Prepared units, cancelled units, and current stock" />
      {items.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3 text-right">Used</th>
                <th className="px-5 py-3 text-right">Cancelled</th>
                <th className="px-5 py-3 text-right">Ordered</th>
                <th className="px-5 py-3 text-right">Stock now</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={`${item.product || item.name}-${item.optionName || "regular"}`}>
                  <td className="px-5 py-4 font-extrabold text-slate-800">{itemName(item)}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-700">{item.usedUnits}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{item.cancelledUnits}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{item.orderedUnits}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={Number(item.currentStock || 0) <= 5 ? "font-extrabold text-brand-700" : "font-bold text-slate-700"}>
                      {item.currentStock ?? "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-extrabold text-slate-900">{money(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState label="No stock movement found in this period." />
      )}
    </article>
  );
}

export default function ReportsPage({
  report,
  range,
  onRangeChange,
  loading,
  error,
}) {
  const summary = report?.summary || {};
  const selectedRange = report?.range;

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Business reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sales, product movement, cancellations, payments, and stock usage.
          </p>
          {selectedRange && (
            <p className="mt-2 text-xs font-bold text-slate-500">
              {dateTime(selectedRange.from)} to {dateTime(selectedRange.to)} | {selectedRange.timeZone}
            </p>
          )}
        </div>
        <select
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
          value={range}
          onChange={(event) => onRangeChange(event.target.value)}
        >
          {REPORT_RANGES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </section>

      {error && (
        <div className="border-l-4 border-brand-600 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Net sales" value={money(summary.netSales)} caption="Non-cancelled order total" />
        <MetricCard label="Orders" value={summary.activeOrders || 0} caption={`${summary.deliveredOrders || 0} delivered`} />
        <MetricCard label="Average order" value={money(summary.averageOrderValue)} caption="Across non-cancelled orders" />
        <MetricCard label="Cancelled" value={summary.cancelledOrders || 0} caption={`Refund exposure ${money(summary.refundAmount)}`} accent />
      </section>

      {loading && !report && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
          Loading reports...
        </div>
      )}

      {report && (
        <>
          <section className="grid gap-5 xl:grid-cols-3">
            <SalesBucket title="Daily sales" rows={report.sales?.daily} />
            <SalesBucket title="Weekly sales" rows={report.sales?.weekly} />
            <SalesBucket title="Monthly sales" rows={report.sales?.monthly} />
          </section>

          <BestSellingTable rows={report.bestSellingItems} />
          <PaymentReport payments={report.payments} />
          <CancellationReport data={report.cancelledOrders} />
          <StockUsageReport rows={report.stockUsage} />
        </>
      )}
    </div>
  );
}
