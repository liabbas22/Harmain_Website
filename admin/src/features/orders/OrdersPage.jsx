import { ORDER_FILTERS } from "../../constants/admin";
import Button from "../../components/ui/Button";
import OrderTable from "./OrderTable";

const pageSizeOptions = [10, 20, 50, 100];

function OrdersLoadingTable({ rows = 8 }) {
  return (
    <div className="min-w-[840px]">
      <div className="grid h-11 grid-cols-[120px_1.4fr_100px_110px_120px_140px_110px_150px] items-center border-b border-slate-200 bg-slate-50 px-4 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        <span>Order</span>
        <span>Customer</span>
        <span>Items</span>
        <span>Total</span>
        <span>Rider</span>
        <span>Status</span>
        <span>Payment</span>
        <span>Created</span>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid h-[70px] grid-cols-[120px_1.4fr_100px_110px_120px_140px_110px_150px] items-center gap-4 px-4"
          >
            {Array.from({ length: 8 }).map((__, column) => (
              <span
                key={column}
                className={`h-3 animate-pulse rounded-full bg-slate-200 ${column === 1 ? "w-32" : column === 5 ? "w-24" : "w-16"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage({
  orders,
  unreadOrderIds,
  filter,
  page,
  limit,
  pagination,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onUpdate,
  onCancel,
  onMarkOrderRead,
  onOpenOrder,
  busyAction,
  loading,
  error,
  total,
}) {
  const pageCount = pagination?.pages || Math.max(1, Math.ceil((total || 0) / limit));
  const currentPage = pagination?.page || page || 1;
  const currentLimit = pagination?.limit || limit || 20;
  const start = total > 0 ? (currentPage - 1) * currentLimit + 1 : 0;
  const end = Math.min(currentPage * currentLimit, total || 0);
  const canGoPrevious = currentPage > 1 && !loading;
  const canGoNext = currentPage < pageCount && !loading;

  return (
    <div className="grid gap-5 mt-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Order queue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track incoming orders and update kitchen progress.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-extrabold text-slate-500">
            {total} {total === 1 ? "order" : "orders"}
          </span>
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
            Show
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
              value={currentLimit}
              disabled={loading}
              onChange={(event) => onLimitChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            per page
          </label>
        </div>
      </section>
      <section className="overflow-x-auto border-b border-slate-200">
        <div
          className="flex gap-1 px-1 min-w-max"
          role="tablist"
          aria-label="Order filters"
        >
          {ORDER_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => onFilterChange(value)}
              className={`border-b-2 px-3 py-3 text-sm font-extrabold transition ${filter === value ? "border-brand-700 text-brand-700" : "border-transparent text-slate-500 hover:border-red-200 hover:text-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      {error && (
        <div className="px-4 py-3 text-sm font-bold border-l-4 border-brand-600 bg-red-50 text-brand-700">
          {error}
        </div>
      )}
      <section className="relative overflow-hidden bg-white border rounded-lg border-slate-200">
        <div className="overflow-x-auto">
          {loading && !orders.length ? (
            <OrdersLoadingTable rows={Math.min(currentLimit, 10)} />
          ) : (
            <OrderTable
              orders={orders}
              unreadOrderIds={unreadOrderIds}
              onUpdate={onUpdate}
              onCancel={onCancel}
              onMarkOrderRead={onMarkOrderRead}
              onOpenOrder={onOpenOrder}
              busyAction={busyAction}
            />
          )}
        </div>
        {loading && (
          <>
            <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-red-100">
              <span className="block w-1/3 h-full animate-pulse bg-brand-700" />
            </div>
            {!!orders.length && (
              <div className="absolute inset-0 grid place-items-center bg-white/55 backdrop-blur-[1px]">
                <span className="inline-flex items-center gap-3 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-extrabold text-brand-700 shadow-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-100 border-t-brand-700" />
                  Loading orders
                </span>
              </div>
            )}
          </>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-500">
          Showing {start} to {end} of {total || 0} orders
        </span>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            variant="secondary"
            className="min-h-9"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="min-w-24 text-center text-xs font-extrabold text-slate-600">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="secondary"
            className="min-h-9"
            disabled={!canGoNext}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
