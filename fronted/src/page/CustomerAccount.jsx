import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiHome,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiShoppingBag,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import api, { apiError } from "../api";

const statusLabels = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const statusStyles = {
  placed: "bg-blue-50 text-blue-700 border-blue-100",
  confirmed: "bg-sky-50 text-sky-700 border-sky-100",
  preparing: "bg-amber-50 text-amber-700 border-amber-100",
  out_for_delivery: "bg-purple-50 text-purple-700 border-purple-100",
  delivered: "bg-green-50 text-green-700 border-green-100",
  cancelled: "bg-red-50 text-red-700 border-red-100",
};
const paymentStyles = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
};
const orderSteps = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const money = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";
const shortId = (id = "") => `#${String(id).slice(-6).toUpperCase()}`;
const titleCase = (value = "") =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const totalOrderItems = (order) =>
  (order.items || []).reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) + Number(item.freeQuantity || 0),
    0,
  );
const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "Karachi",
  area: "",
  instructions: "",
  isDefault: false,
};

const StatusBadge = ({ value }) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusStyles[value] || "border-slate-200 bg-slate-50 text-slate-600"}`}
  >
    {statusLabels[value] || titleCase(value || "placed")}
  </span>
);

const LoadingBlock = () => (
  <div className="grid gap-3">
    {[0, 1, 2].map((item) => (
      <span
        key={item}
        className="h-20 rounded-xl border border-red-100 bg-red-50/70 animate-pulse"
      />
    ))}
  </div>
);

const Field = ({ label, icon, children }) => (
  <label className="block">
    <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-700">
      {icon}
      {label}
    </span>
    {children}
  </label>
);

function OrderProgress({ status }) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
        This order was cancelled.
      </div>
    );
  }
  const activeIndex = Math.max(orderSteps.indexOf(status), 0);
  return (
    <div className="mt-4 grid grid-cols-5 gap-2">
      {orderSteps.map((step, index) => {
        const done = index <= activeIndex;
        return (
          <div key={step} className="min-w-0">
            <span
              className={`block h-1.5 rounded-full ${done ? "bg-red-700" : "bg-red-100"}`}
            />
            <span
              className={`mt-1 block truncate text-[10px] font-bold ${done ? "text-red-700" : "text-gray-400"}`}
            >
              {statusLabels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }) {
  const address = order.deliveryAddress || {};
  const addressText = [
    address.line1,
    address.line2,
    address.area,
    address.city,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/50 px-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="max-h-[calc(100vh-24px)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-red-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-red-700">
              Order details
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-gray-900">
              {shortId(order._id)}
            </h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              {dateTime(order.createdAt)}
            </p>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-700 hover:bg-red-100"
            onClick={onClose}
            aria-label="Close order details"
          >
            <FiX />
          </button>
        </header>
        <div className="grid gap-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                Status
              </span>
              <div className="mt-2">
                <StatusBadge value={order.orderStatus} />
              </div>
            </div>
            <div className="rounded-xl border border-red-100 bg-white p-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                Payment
              </span>
              <b
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] ${paymentStyles[order.paymentStatus] || "bg-slate-100 text-slate-700"}`}
              >
                {titleCase(order.paymentStatus || "pending")}
              </b>
            </div>
            <div className="rounded-xl border border-red-100 bg-white p-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                Items
              </span>
              <b className="mt-2 block text-sm text-gray-900">
                {totalOrderItems(order)} items
              </b>
            </div>
          </div>
          <OrderProgress status={order.orderStatus} />
          <section className="rounded-xl border border-red-100">
            <div className="flex items-center justify-between border-b border-red-100 px-4 py-3">
              <h3 className="text-sm font-extrabold text-gray-900">
                Items ordered
              </h3>
              <span className="text-xs font-bold text-gray-400">
                Rs. {money(order.subtotal)}
              </span>
            </div>
            {(order.items || []).map((item, index) => {
              const paidQuantity = Number(item.quantity || 0);
              const freeQuantity = Number(item.freeQuantity || 0);
              const totalQuantity = paidQuantity + freeQuantity;
              return (
                <article
                  className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-3 border-b border-red-50 px-4 py-3 last:border-0"
                  key={`${item.product || item.name}-${index}`}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-red-50">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-sm font-extrabold text-red-700">
                        {item.name?.charAt(0) || "H"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <b className="block truncate text-sm text-gray-900">
                      {item.name || "Menu item"}
                    </b>
                    <span className="mt-1 block text-xs text-gray-500">
                      {paidQuantity} paid
                      {freeQuantity > 0 ? ` + ${freeQuantity} free` : ""}
                      {item.optionName ? ` | ${item.optionName}` : ""}
                    </span>
                    {item.specialInstructions && (
                      <span className="mt-1 block text-xs font-semibold text-amber-700">
                        Note: {item.specialInstructions}
                      </span>
                    )}
                    {item.addOns?.length > 0 && (
                      <span className="mt-1 block text-xs font-semibold text-gray-500">
                        Add-ons:{" "}
                        {item.addOns
                          .map((addOn) => `${addOn.name} (+Rs. ${money(addOn.price)})`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <b className="text-right text-sm text-gray-900">
                    Rs. {money(Number(item.price || 0) * totalQuantity)}
                  </b>
                </article>
              );
            })}
          </section>
          <section className="grid gap-4 md:grid-cols-[1fr_270px]">
            <div className="rounded-xl border border-red-100 p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                <FiMapPin className="text-red-700" />
                Delivery address
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {address.fullName || "Customer"}
                <br />
                {addressText || "Address not available"}
                <br />
                {address.phone || "No phone"}
              </p>
              {address.instructions && (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  Delivery note: {address.instructions}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-red-100 p-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <b className="text-gray-900">Rs. {money(order.subtotal)}</b>
              </div>
              {Number(order.discount) > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-green-700">
                    <span>Total savings</span>
                    <b>- Rs. {money(order.discount)}</b>
                  </div>
                  {(order.offerBreakdown || []).map((detail, index) => (
                    <div
                      className="mt-2 rounded-lg bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700"
                      key={`${detail.productName}-${index}`}
                    >
                      {detail.quantity} x {detail.productName}
                      {Number(detail.freeQuantity || 0) > 0
                        ? ` + ${detail.freeQuantity} free`
                        : ""}{" "}
                      - Rs. {money(detail.discount)}
                    </div>
                  ))}
                  {order.loyaltyDiscount && (
                    <div className="mt-2 rounded-lg bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
                      {order.loyaltyDiscount.label} - Rs.{" "}
                      {money(order.loyaltyDiscount.discount)}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 flex justify-between text-gray-600">
                <span>Delivery fee</span>
                <b className="text-gray-900">
                  {Number(order.deliveryFee || 0) > 0
                    ? `Rs. ${money(order.deliveryFee)}`
                    : "Free"}
                </b>
              </div>
              <div className="mt-4 flex justify-between border-t border-red-100 pt-4 text-base font-extrabold text-gray-900">
                <span>Grand total</span>
                <span>Rs. {money(order.total)}</span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default function CustomerAccount() {
  const token = localStorage.getItem("harmain_token");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname === "/orders" ? "orders" : "profile",
  );
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressEditorId, setAddressEditorId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    setActiveTab(location.pathname === "/orders" ? "orders" : "profile");
  }, [location.pathname]);

  const loadAccount = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [profileResult, orderResult] = await Promise.all([
        api.get("/auth/me"),
        api.get("/orders/my"),
      ]);
      const nextProfile = profileResult.data.user;
      setProfile(nextProfile);
      setForm({
        name: nextProfile.name || "",
        phone: nextProfile.phone || "",
      });
      setAddressForm({
        ...emptyAddress,
        fullName: nextProfile.name || "",
        phone: nextProfile.phone || "",
      });
      setAddressEditorId("");
      setOrders(orderResult.data || []);
      localStorage.setItem("harmain_user", JSON.stringify(nextProfile));
      window.dispatchEvent(new Event("harmain-user-updated"));
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const metrics = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.orderStatus === "delivered",
    ).length;
    const active = orders.filter(
      (order) =>
        !["delivered", "cancelled"].includes(order.orderStatus || "placed"),
    ).length;
    const spent = orders
      .filter((order) => order.orderStatus !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { delivered, active, spent };
  }, [orders]);

  if (!token) return <Navigate to="/login" replace />;

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (form.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      setProfile(data.user);
      localStorage.setItem("harmain_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("harmain-user-updated"));
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const latestOrder = orders[0] || null;
  const savedAddresses = profile?.savedAddresses || [];
  const updateLocalProfile = (nextProfile) => {
    setProfile(nextProfile);
    localStorage.setItem("harmain_user", JSON.stringify(nextProfile));
    window.dispatchEvent(new Event("harmain-user-updated"));
  };
  const resetAddressForm = () => {
    setAddressEditorId("");
    setAddressForm({
      ...emptyAddress,
      fullName: profile?.name || form.name || "",
      phone: profile?.phone || form.phone || "",
    });
  };
  const editAddress = (address) => {
    setAddressEditorId(address._id);
    setAddressForm({
      ...emptyAddress,
      ...address,
      isDefault: address.isDefault === true,
    });
  };
  const saveAddress = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (addressForm.fullName.trim().length < 2) {
      setError("Enter recipient name for the saved address.");
      return;
    }
    if (!/^\+?\d[\d\s-]{8,}$/.test(addressForm.phone)) {
      setError("Enter a valid phone number for the saved address.");
      return;
    }
    if (addressForm.line1.trim().length < 6 || !addressForm.city.trim()) {
      setError("Enter a complete saved address.");
      return;
    }
    if (!addressForm.area.trim()) {
      setError("Area is required for the saved address.");
      return;
    }
    setAddressSaving(true);
    try {
      const body = {
        ...addressForm,
        label: addressForm.label.trim() || "Home",
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        line1: addressForm.line1.trim(),
        line2: addressForm.line2.trim(),
        city: addressForm.city.trim(),
        area: addressForm.area.trim(),
        instructions: addressForm.instructions.trim(),
      };
      const { data } = addressEditorId
        ? await api.patch(`/auth/me/addresses/${addressEditorId}`, body)
        : await api.post("/auth/me/addresses", body);
      updateLocalProfile({ ...profile, savedAddresses: data.addresses || [] });
      resetAddressForm();
      setMessage(addressEditorId ? "Address updated." : "Address saved.");
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setAddressSaving(false);
    }
  };
  const deleteAddress = async (addressId) => {
    setDeletingAddressId(addressId);
    setMessage("");
    setError("");
    try {
      const { data } = await api.delete(`/auth/me/addresses/${addressId}`);
      updateLocalProfile({ ...profile, savedAddresses: data.addresses || [] });
      if (addressEditorId === addressId) resetAddressForm();
      setMessage("Address removed.");
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setDeletingAddressId("");
    }
  };

  return (
    <main className="min-h-[calc(100vh-160px)] bg-red-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
              Customer account
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
              Profile and order history
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your details and track every Harmain order in one place.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-extrabold text-red-700 shadow-sm hover:bg-red-50"
            onClick={loadAccount}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700">
              <FiShoppingBag />
            </span>
            <b className="mt-3 block text-2xl text-gray-900">
              {orders.length}
            </b>
            <p className="text-xs font-bold text-gray-500">Total orders</p>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-700">
              <FiCheckCircle />
            </span>
            <b className="mt-3 block text-2xl text-gray-900">
              {metrics.delivered}
            </b>
            <p className="text-xs font-bold text-gray-500">Delivered orders</p>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <FiClock />
            </span>
            <b className="mt-3 block text-2xl text-gray-900">
              Rs. {money(metrics.spent)}
            </b>
            <p className="text-xs font-bold text-gray-500">Total spent</p>
          </section>
        </div>

        <div className="mt-7 flex rounded-2xl border border-red-100 bg-white p-1 shadow-sm">
          {[
            ["profile", "Profile"],
            ["orders", "Order history"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`h-11 flex-1 rounded-xl text-sm font-extrabold transition ${activeTab === value ? "bg-red-700 text-white" : "text-gray-500 hover:bg-red-50 hover:text-red-700"}`}
              onClick={() => setActiveTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-5 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </p>
        )}

        <div className="mt-7">
          {loading ? (
            <LoadingBlock />
          ) : activeTab === "profile" ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-red-700 text-lg font-extrabold text-white">
                    {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">
                      Personal details
                    </h2>
                    <p className="text-sm text-gray-500">
                      Keep your contact details ready for checkout.
                    </p>
                  </div>
                </div>
                <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={saveProfile}>
                  <Field label="Full name" icon={<FiUser className="text-red-700" />}>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                  </Field>
                  <Field label="Phone number" icon={<FiPhone className="text-red-700" />}>
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      placeholder="03XX XXXXXXX"
                      className="h-12 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Email address" icon={<FiMail className="text-red-700" />}>
                      <input
                        value={profile?.email || ""}
                        disabled
                        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
                      />
                    </Field>
                  </div>
                  <button
                    disabled={saving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-red-700/20 hover:bg-red-800 disabled:opacity-60 sm:col-span-2"
                  >
                    {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                </form>
                <section className="mt-8 border-t border-red-100 pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                        <FiHome className="text-red-700" />
                        Saved addresses
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Keep delivery details ready for your next order.
                      </p>
                    </div>
                    {addressEditorId && (
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-extrabold text-red-700 hover:bg-red-50"
                      >
                        <FiPlus />
                        New address
                      </button>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3">
                    {savedAddresses.map((address) => (
                      <article
                        key={address._id}
                        className="rounded-2xl border border-red-100 bg-red-50/50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <b className="text-sm text-gray-900">
                                {address.label || "Address"}
                              </b>
                              {address.isDefault && (
                                <span className="rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {address.fullName} | {address.phone}
                              <br />
                              {address.line1}
                              {address.line2 ? `, ${address.line2}` : ""}
                              {address.area ? `, ${address.area}` : ""},{" "}
                              {address.city}
                            </p>
                            {address.instructions && (
                              <p className="mt-2 text-xs font-semibold text-amber-700">
                                Note: {address.instructions}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => editAddress(address)}
                              className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-700 hover:bg-red-100"
                              title="Edit address"
                              aria-label="Edit address"
                            >
                              <FiEdit3 />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAddress(address._id)}
                              disabled={deletingAddressId === address._id}
                              className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-700 hover:bg-red-100 disabled:opacity-60"
                              title="Delete address"
                              aria-label="Delete address"
                            >
                              {deletingAddressId === address._id ? (
                                <FiRefreshCw className="animate-spin" />
                              ) : (
                                <FiTrash2 />
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                    {!savedAddresses.length && (
                      <div className="rounded-2xl border border-dashed border-red-200 p-5 text-center">
                        <p className="text-sm font-bold text-gray-700">
                          No saved addresses yet
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Add one now or save it from checkout.
                        </p>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={saveAddress}
                    className="mt-5 grid gap-4 rounded-2xl border border-red-100 p-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <h4 className="text-sm font-extrabold text-gray-900">
                        {addressEditorId ? "Edit address" : "Add new address"}
                      </h4>
                    </div>
                    <input
                      value={addressForm.label}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          label: event.target.value,
                        })
                      }
                      placeholder="Label e.g. Home, Office"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <input
                      value={addressForm.fullName}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          fullName: event.target.value,
                        })
                      }
                      placeholder="Recipient name"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <input
                      value={addressForm.phone}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          phone: event.target.value,
                        })
                      }
                      placeholder="Phone number"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <input
                      value={addressForm.area}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          area: event.target.value,
                        })
                      }
                      placeholder="Area"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <input
                      value={addressForm.line1}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          line1: event.target.value,
                        })
                      }
                      placeholder="House, street, building"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 sm:col-span-2"
                    />
                    <input
                      value={addressForm.line2}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          line2: event.target.value,
                        })
                      }
                      placeholder="Apartment / landmark"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <input
                      value={addressForm.city}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          city: event.target.value,
                        })
                      }
                      placeholder="City"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <input
                      value={addressForm.instructions}
                      onChange={(event) =>
                        setAddressForm({
                          ...addressForm,
                          instructions: event.target.value,
                        })
                      }
                      placeholder="Delivery instructions"
                      className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 sm:col-span-2"
                    />
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(event) =>
                          setAddressForm({
                            ...addressForm,
                            isDefault: event.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-red-700"
                      />
                      Set as default address
                    </label>
                    <button
                      disabled={addressSaving}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-red-700/20 hover:bg-red-800 disabled:opacity-60 sm:col-span-2"
                    >
                      {addressSaving ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : (
                        <FiSave />
                      )}
                      {addressSaving
                        ? "Saving..."
                        : addressEditorId
                          ? "Update address"
                          : "Save address"}
                    </button>
                  </form>
                </section>
              </section>
              <aside className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                  <FiPackage className="text-red-700" />
                  Latest order
                </h3>
                {latestOrder ? (
                  <button
                    className="mt-4 w-full rounded-xl border border-red-100 p-4 text-left hover:border-red-300 hover:bg-red-50"
                    onClick={() => setSelectedOrder(latestOrder)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <b className="text-gray-900">{shortId(latestOrder._id)}</b>
                      <StatusBadge value={latestOrder.orderStatus} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      {dateTime(latestOrder.createdAt)}
                    </p>
                    <p className="mt-3 text-sm font-extrabold text-red-700">
                      Rs. {money(latestOrder.total)}
                    </p>
                  </button>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-red-200 p-5 text-center">
                    <p className="text-sm font-bold text-gray-700">
                      No orders yet
                    </p>
                    <Link
                      to="/"
                      className="mt-3 inline-block rounded-xl bg-red-700 px-4 py-2 text-xs font-extrabold text-white"
                    >
                      Browse menu
                    </Link>
                  </div>
                )}
              </aside>
            </div>
          ) : (
            <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Your orders
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Click any order to see full receipt and delivery details.
                  </p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                  {metrics.active} active
                </span>
              </div>
              {!orders.length ? (
                <div className="mt-6 rounded-2xl border border-dashed border-red-200 p-10 text-center">
                  <h3 className="text-lg font-extrabold text-gray-900">
                    No order history yet
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Your completed and active orders will show here.
                  </p>
                  <Link
                    to="/"
                    className="mt-5 inline-block rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white"
                  >
                    Start ordering
                  </Link>
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {orders.map((order) => (
                    <button
                      key={order._id}
                      className="grid gap-3 rounded-2xl border border-red-100 p-4 text-left transition hover:border-red-300 hover:bg-red-50 md:grid-cols-[1fr_auto]"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-gray-900">{shortId(order._id)}</b>
                          <StatusBadge value={order.orderStatus} />
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                            {titleCase(order.paymentMethod || "cash_on_delivery")}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          {dateTime(order.createdAt)} | {totalOrderItems(order)} items
                        </p>
                        <p className="mt-2 truncate text-sm text-gray-600">
                          {(order.items || [])
                            .slice(0, 3)
                            .map((item) => item.name)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 md:block md:text-right">
                        <span className="text-xs font-bold text-gray-400">
                          Grand total
                        </span>
                        <b className="block text-base text-red-700">
                          Rs. {money(order.total)}
                        </b>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </main>
  );
}
