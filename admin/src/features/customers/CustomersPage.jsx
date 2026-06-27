import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateTime, money, shortId } from "../../utils/format";

const customerFilters = [
  ["all", "All customers"],
  ["active", "Active"],
  ["blocked", "Blocked"],
];

const emptyLoyalty = {
  isEnabled: false,
  label: "Loyal customer discount",
  discountType: "percentage",
  value: "",
  minimumOrder: "0",
  maxDiscount: "",
  expiresAt: "",
  note: "",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const loyaltyToForm = (loyalty = {}) => ({
  ...emptyLoyalty,
  ...loyalty,
  value: loyalty.value ? String(loyalty.value) : "",
  minimumOrder: String(loyalty.minimumOrder ?? 0),
  maxDiscount:
    loyalty.maxDiscount === null || loyalty.maxDiscount === undefined
      ? ""
      : String(loyalty.maxDiscount),
  expiresAt: toDateInput(loyalty.expiresAt),
});

const StatCard = ({ label, value }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4">
    <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <b className="mt-2 block text-xl text-slate-900">{value}</b>
  </article>
);

function CustomerDetailsModal({
  detail,
  loading,
  busyAction,
  onClose,
  onSaveLoyalty,
  onAddNote,
  onDeleteNote,
  onToggleBlock,
}) {
  const customer = detail?.customer;
  const orders = detail?.orders || [];
  const [noteText, setNoteText] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [loyaltyForm, setLoyaltyForm] = useState(emptyLoyalty);

  useEffect(() => {
    if (!customer) return;
    setLoyaltyForm(loyaltyToForm(customer.loyaltyDiscount));
    setBlockReason(customer.blockedReason || "");
    setNoteText("");
  }, [customer]);

  const loyaltyPayload = useMemo(
    () => ({
      ...loyaltyForm,
      value: Number(loyaltyForm.value || 0),
      minimumOrder: Number(loyaltyForm.minimumOrder || 0),
      maxDiscount:
        loyaltyForm.maxDiscount === "" ? null : Number(loyaltyForm.maxDiscount),
      expiresAt: loyaltyForm.expiresAt
        ? new Date(loyaltyForm.expiresAt).toISOString()
        : null,
    }),
    [loyaltyForm],
  );

  const saveNote = async (event) => {
    event.preventDefault();
    const saved = await onAddNote(customer._id, noteText);
    if (saved) setNoteText("");
  };

  const saveLoyalty = async (event) => {
    event.preventDefault();
    await onSaveLoyalty(customer._id, loyaltyPayload);
  };

  if (!customer) {
    return (
      <Modal title="Customer profile" onClose={onClose} size="max-w-5xl">
        <div className="p-6 text-sm font-bold text-slate-500">
          {loading ? "Loading customer..." : "Customer not found."}
        </div>
      </Modal>
    );
  }

  const stats = customer.stats || {};
  const addresses = customer.savedAddresses || [];
  const notes = customer.customerNotes || [];
  const loyaltyActive = customer.loyaltyDiscount?.isEnabled === true;

  return (
    <Modal title={customer.name || "Customer profile"} onClose={onClose} size="max-w-6xl">
      <div className="grid gap-5 p-4 sm:p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total orders" value={stats.totalOrders || 0} />
          <StatCard label="Delivered" value={stats.deliveredOrders || 0} />
          <StatCard label="Total spent" value={money(stats.totalSpent)} />
          <StatCard
            label="Last order"
            value={stats.lastOrderAt ? dateTime(stats.lastOrderAt) : "-"}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_330px]">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Customer details
                </h3>
                <p className="mt-3 text-sm font-bold text-slate-800">
                  {customer.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{customer.email}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {customer.phone || "No phone saved"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    value={customer.isActive ? "available" : "unavailable"}
                    label={customer.isActive ? "Active" : "Blocked"}
                  />
                  {loyaltyActive && (
                    <StatusBadge value="completed" label="Loyalty active" />
                  )}
                </div>
                {!customer.isActive && customer.blockedReason && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    Block reason: {customer.blockedReason}
                  </p>
                )}
              </div>
              <div className="w-full rounded-lg border border-slate-200 p-3 sm:w-72">
                <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  Suspicious customer control
                </label>
                <textarea
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Reason required when blocking"
                  className="mt-2 min-h-20 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-brand-600"
                />
                <Button
                  variant={customer.isActive ? "danger" : "secondary"}
                  className="mt-3 min-h-10 w-full"
                  disabled={busyAction === `customer-status-${customer._id}`}
                  onClick={() =>
                    onToggleBlock(customer._id, {
                      isActive: !customer.isActive,
                      reason: blockReason,
                    })
                  }
                >
                  {customer.isActive ? "Block customer" : "Unblock customer"}
                </Button>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Saved addresses
            </h3>
            <div className="mt-3 grid max-h-72 gap-3 overflow-y-auto pr-1">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm text-slate-800">
                      {address.label || "Address"}
                    </b>
                    {address.isDefault && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {address.fullName} | {address.phone}
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    {address.area ? `, ${address.area}` : ""}, {address.city}
                  </p>
                </div>
              ))}
              {!addresses.length && (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No saved addresses.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Loyal customer discount
            </h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveLoyalty}>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={loyaltyForm.isEnabled}
                  onChange={(event) =>
                    setLoyaltyForm({
                      ...loyaltyForm,
                      isEnabled: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
                Enable loyalty discount
              </label>
              <input
                value={loyaltyForm.label}
                onChange={(event) =>
                  setLoyaltyForm({ ...loyaltyForm, label: event.target.value })
                }
                className="field sm:col-span-2"
                placeholder="Discount label"
              />
              <select
                value={loyaltyForm.discountType}
                onChange={(event) =>
                  setLoyaltyForm({
                    ...loyaltyForm,
                    discountType: event.target.value,
                  })
                }
                className="field"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
              <input
                value={loyaltyForm.value}
                onChange={(event) =>
                  setLoyaltyForm({ ...loyaltyForm, value: event.target.value })
                }
                className="field"
                placeholder={loyaltyForm.discountType === "fixed" ? "Amount" : "Percent"}
                type="number"
                min="0"
              />
              <input
                value={loyaltyForm.minimumOrder}
                onChange={(event) =>
                  setLoyaltyForm({
                    ...loyaltyForm,
                    minimumOrder: event.target.value,
                  })
                }
                className="field"
                placeholder="Minimum order"
                type="number"
                min="0"
              />
              <input
                value={loyaltyForm.maxDiscount}
                onChange={(event) =>
                  setLoyaltyForm({
                    ...loyaltyForm,
                    maxDiscount: event.target.value,
                  })
                }
                className="field"
                placeholder="Max discount"
                type="number"
                min="0"
              />
              <input
                value={loyaltyForm.expiresAt}
                onChange={(event) =>
                  setLoyaltyForm({
                    ...loyaltyForm,
                    expiresAt: event.target.value,
                  })
                }
                className="field sm:col-span-2"
                type="datetime-local"
              />
              <textarea
                value={loyaltyForm.note}
                onChange={(event) =>
                  setLoyaltyForm({ ...loyaltyForm, note: event.target.value })
                }
                className="field min-h-20 sm:col-span-2"
                placeholder="Internal loyalty note"
              />
              <Button
                type="submit"
                className="min-h-10 sm:col-span-2"
                disabled={busyAction === `customer-loyalty-${customer._id}`}
              >
                Save loyalty discount
              </Button>
            </form>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Customer notes
            </h3>
            <form className="mt-4" onSubmit={saveNote}>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                className="field min-h-24 w-full"
                placeholder="Add private admin note"
              />
              <Button
                type="submit"
                className="mt-3 min-h-10 w-full"
                disabled={busyAction === `customer-note-${customer._id}`}
              >
                Add note
              </Button>
            </form>
            <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-sm leading-6 text-slate-700">{note.text}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <small className="text-[11px] font-bold text-slate-400">
                      {note.createdByName || "Admin"} | {dateTime(note.createdAt)}
                    </small>
                    <Button
                      variant="text"
                      className="min-h-0 px-0 text-xs text-red-700"
                      disabled={busyAction === `customer-note-delete-${note._id}`}
                      onClick={() => onDeleteNote(customer._id, note._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!notes.length && (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No internal notes yet.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Recent order history
            </h3>
            <span className="text-xs font-extrabold text-slate-500">
              {orders.length} shown
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr className="border-t border-slate-100" key={order._id}>
                    <td className="px-4 py-3">
                      <b className="text-slate-900">{shortId(order._id)}</b>
                      <small className="mt-1 block text-slate-400">
                        {dateTime(order.createdAt)}
                      </small>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {(order.items || []).map((item) => item.name).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                      {money(order.total)}
                    </td>
                  </tr>
                ))}
                {!orders.length && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                      No orders found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}

export default function CustomersPage({
  customers,
  total,
  search,
  status,
  loading,
  error,
  selectedDetail,
  detailLoading,
  busyAction,
  onSearchChange,
  onStatusChange,
  onOpenCustomer,
  onCloseCustomer,
  onSaveLoyalty,
  onAddNote,
  onDeleteNote,
  onToggleBlock,
}) {
  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Customer profiles
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review customer history, notes, loyalty discounts and safety blocks.
          </p>
        </div>
        <span className="text-sm font-extrabold text-slate-500">
          {total} {total === 1 ? "customer" : "customers"}
        </span>
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="field"
          placeholder="Search by name, email or phone"
        />
        <div className="flex gap-1 overflow-x-auto">
          {customerFilters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(value)}
              className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-extrabold transition ${status === value ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="border-l-4 border-brand-600 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700">
          {error}
        </div>
      )}

      <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Last order</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer._id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <b className="block text-slate-900">{customer.name}</b>
                    <small className="mt-1 block text-slate-500">
                      {customer.email}
                    </small>
                    <small className="mt-1 block text-slate-400">
                      {customer.phone || "No phone"}
                    </small>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        value={customer.isActive ? "available" : "unavailable"}
                        label={customer.isActive ? "Active" : "Blocked"}
                      />
                      {customer.loyaltyDiscount?.isEnabled && (
                        <StatusBadge value="completed" label="Loyalty" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    {customer.stats?.totalOrders || 0}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    {money(customer.stats?.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {customer.stats?.lastOrderAt
                      ? dateTime(customer.stats.lastOrderAt)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      className="min-h-9"
                      onClick={() => onOpenCustomer(customer._id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {!customers.length && !loading && (
                <tr>
                  <td className="px-4 py-8 text-sm text-slate-500" colSpan={6}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-red-100">
            <span className="block h-full w-1/3 animate-pulse bg-brand-700" />
          </div>
        )}
      </section>

      {(selectedDetail || detailLoading) && (
        <CustomerDetailsModal
          detail={selectedDetail}
          loading={detailLoading}
          busyAction={busyAction}
          onClose={onCloseCustomer}
          onSaveLoyalty={onSaveLoyalty}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          onToggleBlock={onToggleBlock}
        />
      )}
    </div>
  );
}
