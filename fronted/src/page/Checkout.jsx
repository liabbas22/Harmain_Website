import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiLoader,
  FiMapPin,
  FiPhone,
  FiTag,
  FiUser,
  FiX,
} from "react-icons/fi";
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
const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
const detailMatchesItem = (detail, item) =>
  detail?.productId === String(item.product?._id || item.product || "") &&
  (detail.optionName || "") === (item.optionName || "");
const couponMatchesInput = (coupon, code) =>
  coupon?.code && coupon.code === code.trim().toUpperCase();
const automaticSavingName = (offer) =>
  offer?.label || offer?.name || "Automatic savings";
const SummarySkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((item) => (
      <div key={item} className="flex items-center justify-between gap-3">
        <span className="w-32 h-4 bg-red-100 rounded-full animate-pulse" />
        <span className="w-16 h-4 bg-red-100 rounded-full animate-pulse" />
      </div>
    ))}
  </div>
);
const CheckingSavings = () => (
  <section className="px-3 py-3 mt-5 border border-red-100 rounded-xl bg-red-50/70">
    <div className="flex items-center gap-2 text-xs font-extrabold text-red-700">
      <FiLoader className="animate-spin" />
      Checking best savings...
    </div>
    <div className="mt-3 space-y-2">
      <span className="block w-40 h-3 bg-red-100 rounded-full animate-pulse" />
      <span className="block w-24 h-3 bg-red-100 rounded-full animate-pulse" />
    </div>
  </section>
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
  const [discountQuote, setDiscountQuote] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponAvailable, setCouponAvailable] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const loadCheckout = async () => {
      setCartLoading(true);
      setQuoteLoading(true);
      const [cartResult, quoteResult, couponResult] = await Promise.allSettled([
        api.get("/cart"),
        api.post("/offers/quote", { couponCode: "" }),
        api.get("/coupons/availability"),
      ]);

      if (!isMounted) return;

      if (cartResult.status === "fulfilled") {
        setCart(cartResult.value.data);
      } else {
        setStatus("Please sign in again to continue.");
      }

      setDiscountQuote(
        quoteResult.status === "fulfilled" ? quoteResult.value.data : null,
      );
      setCouponAvailable(
        couponResult.status === "fulfilled"
          ? Boolean(couponResult.value.data.available)
          : false,
      );
      setCartLoading(false);
      setQuoteLoading(false);
    };

    loadCheckout();

    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    if (!cartLoading && !cart?.items?.length) {
      setDiscountQuote(null);
      setQuoteLoading(false);
      return;
    }
  }, [cart, cartLoading]);
  if (!localStorage.getItem("harmain_token"))
    return <Navigate to="/login" replace />;
  const items = cart?.items || [];
  const total = items.reduce(
    (sum, item) =>
      sum + (item.unitPrice ?? item.product?.price ?? 0) * item.quantity,
    0,
  );
  const appliedDiscount = discountQuote?.applied;
  const discount = appliedDiscount?.discount || 0;
  const delivery = discountQuote?.delivery || null;
  const deliveryFee = Number(discountQuote?.deliveryFee ?? delivery?.deliveryFee ?? 0);
  const grandTotal = Number(discountQuote?.grandTotal ?? Math.max(0, total - discount + deliveryFee));
  const activeOfferDetails =
    appliedDiscount?.type === "offer" ? appliedDiscount.details || [] : [];
  const isCheckingSavings = quoteLoading && items.length > 0;
  const deliveryUnavailable = delivery?.isDeliveryEnabled === false;
  const canPlaceOrder = total >= MINIMUM_ORDER && !deliveryUnavailable;
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
    setQuoteLoading(true);
    setCouponMessage("");
    try {
      const { data } = await api.post("/offers/quote", { couponCode: code });
      setDiscountQuote(data);
      setCouponCode(code);
      setCouponMessage(
        data.applied?.type === "coupon"
          ? `${data.applied.label} applied. You saved Rs. ${formatMoney(data.applied.discount)}.`
          : data.coupon && data.automaticOffer
            ? `${data.coupon.code} is valid and saves Rs. ${formatMoney(data.coupon.discount)}, but ${automaticSavingName(data.automaticOffer)} saves Rs. ${formatMoney(data.applied?.discount || data.automaticOffer.discount)}. Best discount applied automatically.`
            : data.automaticOffer
              ? `${automaticSavingName(data.automaticOffer)} gives the better saving of Rs. ${formatMoney(data.applied?.discount || data.automaticOffer.discount)}.`
              : "No discount is available for this order.",
      );
    } catch (error) {
      setCouponMessage(apiError(error));
    } finally {
      setApplyingCoupon(false);
      setQuoteLoading(false);
    }
  };
  const removeCoupon = () => {
    setCouponCode("");
    setCouponMessage("");
    setShowCouponForm(false);
    setQuoteLoading(true);
    api
      .post("/offers/quote", { couponCode: "" })
      .then(({ data }) => setDiscountQuote(data))
      .catch(() => setDiscountQuote(null))
      .finally(() => setQuoteLoading(false));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (deliveryUnavailable) {
      setStatus("Delivery is currently unavailable.");
      return;
    }
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
        couponCode: appliedDiscount?.type === "coupon" ? couponCode : "",
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
              disabled={
                submitting ||
                cartLoading ||
                quoteLoading ||
                !items.length ||
                !canPlaceOrder
              }
              title={
                deliveryUnavailable
                  ? "Delivery is currently unavailable"
                  : !canPlaceOrder
                    ? `Minimum order is Rs. ${MINIMUM_ORDER}`
                    : "Place order"
              }
              className="flex items-center justify-center w-full h-12 gap-2 text-sm font-extrabold text-white bg-red-700 shadow-lg mt-7 rounded-xl shadow-red-700/20 disabled:opacity-60"
            >
              <FiCheckCircle />
              {submitting
                ? "Placing order..."
                : quoteLoading
                  ? "Checking savings..."
                  : deliveryUnavailable
                    ? "Delivery unavailable"
                    : "Place order"}
            </button>
          </form>
          <aside className="p-6 bg-white shadow-sm h-fit rounded-2xl">
            <h2 className="text-lg font-extrabold text-gray-900">
              Order summary
            </h2>
            <div className="py-4 mt-5 space-y-3 text-sm border-red-100 border-y">
              {cartLoading ? (
                <SummarySkeleton />
              ) : (
                items.map((item) => {
                  const { product, quantity, unitPrice, optionName } = item;
                  const itemOffer = activeOfferDetails.find((detail) =>
                    detailMatchesItem(detail, item),
                  );
                  return (
                    product && (
                      <div
                        key={`${product._id}-${optionName || "regular"}`}
                        className="flex justify-between gap-3"
                      >
                        <span className="min-w-0 text-gray-600">
                          <span className="block line-clamp-1">
                            {quantity} x {product.name}
                          </span>
                          {itemOffer && (
                            <small className="block mt-1 text-xs font-bold text-green-700">
                              {itemOffer.offerName} ({itemOffer.offerLabel}) -
                              Rs. {formatMoney(itemOffer.discount)}
                            </small>
                          )}
                        </span>
                        <b className="shrink-0">
                          Rs.{" "}
                          {formatMoney((unitPrice ?? product.price) * quantity)}
                        </b>
                      </div>
                    )
                  );
                })
              )}
            </div>
            {isCheckingSavings && <CheckingSavings />}
            {!isCheckingSavings && discountQuote?.automaticOffer && (
              <section className="px-3 py-3 mt-5 border rounded-xl border-amber-200 bg-amber-50">
                <b className="block text-xs text-amber-800">
                  Automatic savings:{" "}
                  {discountQuote.automaticOffer.label ||
                    discountQuote.automaticOffer.name}
                </b>
                <span className="block mt-1 text-xs text-amber-700">
                  Save Rs. {formatMoney(discountQuote.automaticOffer.discount)}{" "}
                  when this gives the best value.
                </span>
                {discountQuote.automaticOffer.details?.length > 0 && (
                  <div className="pt-2 mt-2 space-y-1 border-t border-amber-200">
                    {discountQuote.automaticOffer.details.map((detail) => (
                      <div
                        key={`${detail.productId}-${detail.optionName || "regular"}-${detail.offerName}`}
                        className="flex justify-between gap-3 text-[11px] font-bold text-amber-800"
                      >
                        <span className="min-w-0 truncate">
                          {detail.quantity} x {detail.productName} -{" "}
                          {detail.offerLabel}
                        </span>
                        <span className="shrink-0">
                          - Rs. {formatMoney(detail.discount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
            {(couponAvailable || appliedDiscount?.type === "coupon") && (
              <section className="p-3 mt-5 border border-red-100 rounded-xl bg-red-50/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                    <FiTag className="text-red-700" />
                    Coupon code
                  </div>
                  {!showCouponForm && appliedDiscount?.type !== "coupon" && (
                    <button
                      type="button"
                      onClick={() => setShowCouponForm(true)}
                      className="text-xs font-extrabold text-red-700 hover:text-red-800"
                    >
                      Have a coupon?
                    </button>
                  )}
                </div>
                {appliedDiscount?.type === "coupon" ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2 mt-3 bg-white border border-green-200 rounded-lg">
                    <div className="min-w-0">
                      <b className="block text-sm text-green-700">
                        {appliedDiscount.label}
                      </b>
                      <span className="block text-xs text-gray-500">
                        You save Rs. {formatMoney(appliedDiscount.discount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="grid w-8 h-8 text-red-700 rounded-full shrink-0 place-items-center hover:bg-red-50"
                      title="Remove coupon"
                      aria-label="Remove coupon"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : showCouponForm ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase());
                        setCouponMessage("");
                      }}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 min-w-0 px-3 py-2 text-sm font-bold uppercase bg-white border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !items.length}
                      className="px-3 text-xs font-extrabold text-white transition bg-red-700 rounded-lg hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {applyingCoupon ? "Checking..." : "Apply"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCouponForm(false);
                        setCouponMessage("");
                      }}
                      className="grid w-10 h-10 text-red-700 rounded-lg shrink-0 place-items-center hover:bg-white"
                      title="Hide coupon"
                      aria-label="Hide coupon"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    Active coupon available. Add your code if you have one.
                  </p>
                )}
                {showCouponForm &&
                  discountQuote?.coupon &&
                  appliedDiscount?.type !== "coupon" &&
                  couponMatchesInput(discountQuote.coupon, couponCode) && (
                    <div className="px-3 py-2 mt-3 bg-white border border-green-200 rounded-lg">
                      <b className="block text-xs text-green-700">
                        {discountQuote.coupon.code} is valid
                      </b>
                      <span className="block mt-1 text-xs leading-5 text-gray-500">
                        This coupon saves Rs.{" "}
                        {formatMoney(discountQuote.coupon.discount)}, but{" "}
                        {automaticSavingName(discountQuote.automaticOffer)} is
                        giving the better discount right now.
                      </span>
                    </div>
                  )}
                {couponMessage && (
                  <p
                    className={`mt-2 text-xs font-semibold ${couponMessage.includes("applied") || couponMessage.includes("valid") || couponMessage.includes("better saving") ? "text-green-700" : "text-red-700"}`}
                  >
                    {couponMessage}
                  </p>
                )}
              </section>
            )}
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                {cartLoading ? (
                  <span className="w-16 h-4 bg-red-100 rounded-full animate-pulse" />
                ) : (
                  <b className="text-gray-900">Rs. {formatMoney(total)}</b>
                )}
              </div>
              {!isCheckingSavings && discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>
                    {appliedDiscount?.type === "coupon"
                      ? "Coupon discount"
                      : appliedDiscount?.kind === "items"
                        ? "Item offers"
                        : "Automatic offer"}
                  </span>
                  <b>- Rs. {formatMoney(discount)}</b>
                </div>
              )}
              {!cartLoading && !isCheckingSavings && delivery && (
                <div className={delivery.isFreeDelivery ? "text-green-700" : "text-gray-600"}>
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <b className={delivery.isFreeDelivery ? "text-green-700" : "text-gray-900"}>
                      {delivery.isFreeDelivery ? "Free" : `Rs. ${formatMoney(deliveryFee)}`}
                    </b>
                  </div>
                  {delivery.freeDeliveryRemaining > 0 && (
                    <small className="mt-1 block text-xs text-red-700">
                      Add Rs. {formatMoney(delivery.freeDeliveryRemaining)} more for free delivery.
                    </small>
                  )}
                  {delivery.estimatedMinutes > 0 && (
                    <small className="mt-1 block text-xs text-gray-400">
                      Estimated delivery: {delivery.estimatedMinutes} minutes
                    </small>
                  )}
                </div>
              )}
              {!cartLoading && !isCheckingSavings && deliveryUnavailable && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  Delivery is currently unavailable.
                </div>
              )}
            </div>
            <div className="flex justify-between pt-4 mt-4 text-base font-extrabold border-t border-red-100">
              <span>Grand Total</span>
              {cartLoading || isCheckingSavings ? (
                <span className="flex items-center gap-2 text-sm text-red-700">
                  <FiLoader className="animate-spin" />
                  Calculating
                </span>
              ) : (
                <span>Rs. {formatMoney(grandTotal)}</span>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
