import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiMapPin, FiPhone, FiTag, FiUser, FiX } from "react-icons/fi";
import api, { apiError } from "../api";

const MINIMUM_ORDER = 500;
const initialForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "Karachi",
  area: "",
  instructions: "",
};
const Field = ({ label, icon, error, children }) => (
  <label className="block">
    <span className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
      {icon}
      {label}
    </span>
    {children}
    {error && (
      <span className="block mt-1 text-xs font-semibold text-red-700">
        {error}
      </span>
    )}
  </label>
);

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    fullName:
      JSON.parse(localStorage.getItem("harmain_user") || "null")?.name || "",
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  useEffect(() => {
    api
      .get("/cart")
      .then(({ data }) => setCart(data))
      .catch(() => setStatus("Please sign in again to continue."));
  }, []);
  if (!localStorage.getItem("harmain_token"))
    return <Navigate to="/login" replace />;
  const items = cart?.items || [];
  const total = items.reduce(
    (sum, item) =>
      sum + (item.unitPrice ?? item.product?.price ?? 0) * item.quantity,
    0,
  );
  const discount = appliedCoupon?.discount || 0;
  const grandTotal = Math.max(0, total - discount);
  const canPlaceOrder = total >= MINIMUM_ORDER;
  const update = (name) => (event) =>
    setForm({ ...form, [name]: event.target.value });
  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2)
      next.fullName = "Enter recipient name.";
    if (!/^\+?\d[\d\s-]{8,}$/.test(form.phone))
      next.phone = "Enter a valid phone number.";
    if (form.line1.trim().length < 6) next.line1 = "Enter complete address.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.area.trim()) next.area = "Area is required.";
    setErrors(next);
    return !Object.keys(next).length;
  };
  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    setApplyingCoupon(true);
    setCouponMessage("");
    try {
      const { data } = await api.post("/coupons/validate", {
        code,
        subtotal: total,
      });
      setAppliedCoupon(data);
      setCouponCode(data.coupon.code);
      setCouponMessage(`${data.coupon.code} applied. You saved Rs. ${data.discount}.`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(apiError(error));
    } finally {
      setApplyingCoupon(false);
    }
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!canPlaceOrder) {
      setStatus(`Minimum order amount is Rs. ${MINIMUM_ORDER}.`);
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    setStatus("");
    try {
      const { data } = await api.post("/orders/checkout", {
        paymentMethod: "cash_on_delivery",
        deliveryAddress: form,
        couponCode: appliedCoupon?.coupon?.code || "",
      });
      setStatus(
        `Order #${data._id.slice(-6).toUpperCase()} placed successfully.`,
      );
      setTimeout(() => navigate("/"), 1700);
    } catch (error) {
      setStatus(apiError(error));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="min-h-[calc(100vh-160px)] bg-red-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
          Secure checkout
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Delivery details
        </h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_330px]">
          <form
            onSubmit={submit}
            className="p-5 bg-white shadow-sm rounded-2xl sm:p-8"
          >
            <div className="flex items-center gap-3 mb-7">
              <span className="grid w-10 h-10 text-red-700 rounded-full place-items-center bg-red-50">
                <FiMapPin />
              </span>
              <div>
                <h2 className="font-extrabold text-gray-900">
                  Where should we deliver?
                </h2>
                <p className="text-sm text-gray-500">
                  Your details are used only for this order.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                icon={<FiUser />}
                error={errors.fullName}
              >
                <input
                  value={form.fullName}
                  onChange={update("fullName")}
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </Field>
              <Field
                label="Phone number"
                icon={<FiPhone />}
                error={errors.phone}
              >
                <input
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="03XX XXXXXXX"
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address" icon={<FiMapPin />} error={errors.line1}>
                  <input
                    value={form.line1}
                    onChange={update("line1")}
                    placeholder="House, street, building or landmark"
                    className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </Field>
              </div>
              <Field label="Apartment / landmark">
                <input
                  value={form.line2}
                  onChange={update("line2")}
                  placeholder="Optional"
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </Field>
              <Field label="Area" error={errors.area}>
                <input
                  value={form.area}
                  onChange={update("area")}
                  placeholder="e.g. Bahadurabad"
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </Field>
              <Field label="City" error={errors.city}>
                <input
                  value={form.city}
                  onChange={update("city")}
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </Field>
              <Field label="Delivery instructions">
                <input
                  value={form.instructions}
                  onChange={update("instructions")}
                  placeholder="Optional"
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </Field>
            </div>
            <div className="p-4 border border-red-100 mt-7 rounded-xl bg-red-50">
              <p className="text-sm font-extrabold text-gray-900">
                Payment method
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Cash on delivery - pay when your order arrives.
              </p>
            </div>
            {status && (
              <p
                className={`mt-5 rounded-lg p-3 text-sm font-semibold ${status.includes("successfully") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {status}
              </p>
            )}
            <button
              disabled={submitting || !items.length || !canPlaceOrder}
              title={
                !canPlaceOrder
                  ? `Minimum order is Rs. ${MINIMUM_ORDER}`
                  : "Place order"
              }
              className="flex items-center justify-center w-full h-12 gap-2 text-sm font-extrabold text-white bg-red-700 shadow-lg mt-7 rounded-xl shadow-red-700/20 disabled:opacity-60"
            >
              <FiCheckCircle />
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </form>
          <aside className="p-6 bg-white shadow-sm h-fit rounded-2xl">
            <h2 className="text-lg font-extrabold text-gray-900">
              Order summary
            </h2>
            <div className="py-4 mt-5 space-y-3 text-sm border-red-100 border-y">
              {items.map(
                ({ product, quantity, unitPrice, optionName }) =>
                  product && (
                    <div
                      key={`${product._id}-${optionName || "regular"}`}
                      className="flex justify-between gap-3"
                    >
                      <span className="text-gray-600 line-clamp-1">
                        {quantity} x {product.name}
                      </span>
                      <b>Rs. {(unitPrice ?? product.price) * quantity}</b>
                    </div>
                  ),
              )}
            </div>
            <section className="mt-5 rounded-xl border border-red-100 bg-red-50/60 p-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                <FiTag className="text-red-700" />
                Coupon code
              </div>
              {appliedCoupon ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <b className="block text-sm text-green-700">{appliedCoupon.coupon.code}</b>
                    <span className="block text-xs text-gray-500">You save Rs. {appliedCoupon.discount}</span>
                  </div>
                  <button type="button" onClick={removeCoupon} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-red-700 hover:bg-red-50" title="Remove coupon" aria-label="Remove coupon"><FiX /></button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponMessage(""); }} placeholder="e.g. WELCOME10" className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold uppercase outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100" />
                  <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !items.length} className="rounded-lg bg-red-700 px-3 text-xs font-extrabold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">{applyingCoupon ? "Checking..." : "Apply"}</button>
                </div>
              )}
              {!appliedCoupon && couponMessage && <p className="mt-2 text-xs font-semibold text-red-700">{couponMessage}</p>}
            </section>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><b className="text-gray-900">Rs. {total}</b></div>
              {discount > 0 && <div className="flex justify-between text-green-700"><span>Coupon discount</span><b>- Rs. {discount}</b></div>}
            </div>
            <div className="flex justify-between pt-4 mt-4 text-base font-extrabold border-t border-red-100">
              <span>Grand Total</span>
              <span>Rs. {grandTotal}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
