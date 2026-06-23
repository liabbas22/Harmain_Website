import OrderTable from "./OrderTable";

export default function OrdersPage({ orders, onUpdate, onOpenOrder, busyAction }) {
  return <div className="mt-6 grid gap-5"><section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-extrabold text-slate-900">Order queue</h2><p className="mt-1 text-sm text-slate-500">Update order progress and payment verification.</p></div><span className="text-sm font-extrabold text-slate-500">{orders.length} orders</span></section><section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><OrderTable orders={orders} onUpdate={onUpdate} onOpenOrder={onOpenOrder} busyAction={busyAction} /></div></section></div>;
}
