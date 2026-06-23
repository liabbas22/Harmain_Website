import { ORDER_STATUSES } from "../../constants/admin";
import Button from "../../components/ui/Button";
import ProductThumb from "../../components/ui/ProductThumb";
import { money } from "../../utils/format";
import OrderTable from "../orders/OrderTable";

export default function OverviewPage({ metrics, orders, products, onNavigate, onOpenOrder }) {
  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.orderStatus === status).length,
  }));
  const maxCount = Math.max(...statusCounts.map((item) => item.count), 1);
  const lowStockProducts = products.filter((product) => Number(product.stock) <= 5);
  const cards = [
    ["Order value", money(metrics.revenue), "All non-cancelled orders", false],
    ["Open orders", metrics.activeOrders, "Awaiting completion", false],
    ["Menu products", metrics.products, "Current catalogue", false],
    ["Low stock", metrics.lowStock, "Five units or fewer", true],
  ];

  return (
    <div className="mt-6 grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, caption, accent]) => (
          <article key={label} className="min-h-32 rounded-lg border border-slate-200 bg-white p-5">
            <span className="text-xs font-extrabold text-slate-500">{label}</span>
            <strong className={`my-4 block text-3xl font-extrabold ${accent ? "text-brand-700" : "text-slate-900"}`}>{value}</strong>
            <small className="text-xs text-slate-500">{caption}</small>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Order flow</h2>
              <p className="mt-1 text-xs text-slate-500">Current order distribution</p>
            </div>
            <Button variant="text" className="min-h-0 px-0 text-xs" onClick={() => onNavigate("orders")}>View orders</Button>
          </div>
          <div className="grid gap-4 p-5">
            {statusCounts.map(({ status, count }) => (
              <div className="grid grid-cols-[116px_minmax(0,1fr)_28px] items-center gap-3 text-xs" key={status}>
                <span className="capitalize text-slate-600">{status.replaceAll("_", " ")}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><i className="block h-full min-w-[2px] rounded-full bg-brand-600" style={{ width: `${(count / maxCount) * 100}%` }} /></div>
                <b className="text-right text-slate-800">{count}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="grid h-[360px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Stock watch</h2>
              <p className="mt-1 text-xs text-slate-500">Items that need attention</p>
            </div>
            <Button variant="text" className="min-h-0 px-0 text-xs" onClick={() => onNavigate("products")}>Manage menu</Button>
          </div>
          <div className="overflow-y-scroll overscroll-contain">
            {lowStockProducts.map((product) => (
              <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0" key={product._id}>
                <ProductThumb image={product.image} name={product.name} className="h-9 w-9" />
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-slate-800">{product.name}</strong>
                  <small className="mt-1 block truncate text-[11px] text-slate-500">{product.category?.name || "Uncategorised"}</small>
                </div>
                <b className={Number(product.stock) === 0 ? "text-xs text-red-700" : "text-xs text-amber-700"}>{product.stock} left</b>
              </div>
            ))}
            {!lowStockProducts.length && <p className="p-5 text-sm text-slate-500">No low-stock products right now.</p>}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Recent orders</h2>
            <p className="mt-1 text-xs text-slate-500">Latest customer activity</p>
          </div>
          <Button variant="text" className="min-h-0 px-0 text-xs" onClick={() => onNavigate("orders")}>Open queue</Button>
        </div>
        <div className="overflow-x-auto"><OrderTable orders={orders.slice(0, 6)} compact onOpenOrder={onOpenOrder} /></div>
      </section>
    </div>
  );
}
