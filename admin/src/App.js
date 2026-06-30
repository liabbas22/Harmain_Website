import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "./api/adminApi";
import { emptyAdminUser, emptyCategory, emptyCoupon, emptyOffer, emptyProduct, emptyRider, hasAdminPermission, navigationItems } from "./constants/admin";
import AdminShell from "./components/layout/AdminShell";
import AlertDialog from "./components/ui/AlertDialog";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import Toast from "./components/ui/Toast";
import LoginScreen from "./features/auth/LoginScreen";
import CategoriesPage from "./features/categories/CategoriesPage";
import CategoryEditor from "./features/categories/CategoryEditor";
import HeroBannersPage from "./features/banners/HeroBannersPage";
import CouponEditor from "./features/coupons/CouponEditor";
import CouponsPage from "./features/coupons/CouponsPage";
import CustomersPage from "./features/customers/CustomersPage";
import FeedbackPage from "./features/feedback/FeedbackPage";
import OfferEditor from "./features/offers/OfferEditor";
import OffersPage from "./features/offers/OffersPage";
import OverviewPage from "./features/dashboard/OverviewPage";
import DeliverySettingsPage from "./features/settings/DeliverySettingsPage";
import CancelOrderModal from "./features/orders/CancelOrderModal";
import OrdersPage from "./features/orders/OrdersPage";
import OrderDetailsModal from "./features/orders/OrderDetailsModal";
import ReportsPage from "./features/reports/ReportsPage";
import RiderEditor from "./features/riders/RiderEditor";
import RidersPage from "./features/riders/RidersPage";
import SecurityPage from "./features/security/SecurityPage";
import ProductEditor from "./features/products/ProductEditor";
import ProductsPage from "./features/products/ProductsPage";
import { useAdminWorkspace } from "./hooks/useAdminWorkspace";
import { useOrderNotifications } from "./hooks/useOrderNotifications";
import { productCategoryId, shortId } from "./utils/format";
import { clearAdminSession, readAdminSession, saveAdminSession } from "./utils/session";

const newOptionId = () => `${Date.now()}-${Math.random()}`;
const newAddOnId = () => `${Date.now()}-${Math.random()}-addon`;
const newComboItemId = () => `${Date.now()}-${Math.random()}-combo`;
const hasPriceValue = (value) =>
  value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0;

const toProductEditor = (product) => ({
  id: product._id,
  values: {
    ...emptyProduct(productCategoryId(product)),
    ...product,
    category: productCategoryId(product),
    stock: String(product.stock ?? 0),
    tags: (product.tags || []).join(", "),
    displayOrder: String(product.displayOrder ?? 0),
    availabilitySchedule: {
      ...emptyProduct().availabilitySchedule,
      ...(product.availabilitySchedule || {}),
      days: product.availabilitySchedule?.days || [],
    },
    addOns: (product.addOns || []).map((addOn, index) => ({
      ...addOn,
      clientId: addOn._id || `addon-${index}-${newAddOnId()}`,
      price: String(addOn.price ?? ""),
      isAvailable: addOn.isAvailable !== false,
    })),
    comboItems: (product.comboItems || []).map((item, index) => ({
      clientId: item._id || `combo-${index}-${newComboItemId()}`,
      product: item.product?._id || item.product || "",
      quantity: String(item.quantity ?? 1),
      label: item.label || item.product?.name || item.productName || "",
      optionName: item.optionName || "",
    })),
    options: (product.options || []).map((option, index) => ({
      ...option,
      clientId: option._id || `option-${index}-${newOptionId()}`,
      actualPrice: String(option.actualPrice ?? ""),
      discountPrice: option.discountPrice ?? "",
      tag: option.tag || "",
    })),
  },
});

const createProductPayload = (values, products = []) => {
  const options = values.options
    .map((option) => {
      const hasActualPrice = hasPriceValue(option.actualPrice);
      const hasDiscountPrice = hasPriceValue(option.discountPrice);
      const actualPrice = hasActualPrice
        ? Number(option.actualPrice)
        : Number(option.discountPrice);
      return {
        name: option.name.trim() || "Regular",
        actualPrice,
        ...(hasDiscountPrice ? { discountPrice: Number(option.discountPrice) } : {}),
        tag: option.tag.trim(),
      };
    })
    .filter((option) => option.name && Number(option.actualPrice) > 0);
  const firstOption = options[0];
  const addOns = values.addOns
    .filter((addOn) => addOn.name.trim() && addOn.price !== "")
    .map((addOn) => ({
      name: addOn.name.trim(),
      price: Number(addOn.price),
      isAvailable: addOn.isAvailable !== false,
    }));
  const comboItems = values.isComboMeal
    ? (values.comboItems || [])
        .filter((item) => item.product)
        .map((item) => {
          const comboProduct = products.find(
            (product) => product._id === item.product,
          );
          return {
            product: item.product,
            quantity: Math.max(1, Number(item.quantity || 1)),
            label: item.label || "",
            optionName: item.optionName || comboProduct?.options?.[0]?.name || "",
          };
        })
    : [];
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    image: values.image.trim(),
    category: values.category,
    price: firstOption?.discountPrice ?? firstOption?.actualPrice ?? Number(values.price || 0),
    stock: Number(values.stock || 0),
    tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    isAvailable: values.isAvailable,
    isFeatured: values.isFeatured,
    isPopular: values.isPopular,
    isComboMeal: values.isComboMeal,
    comboItems,
    displayOrder: Number(values.displayOrder || 0),
    availabilitySchedule: {
      isEnabled: values.availabilitySchedule?.isEnabled === true,
      days: values.availabilitySchedule?.days || [],
      startTime: values.availabilitySchedule?.startTime || "",
      endTime: values.availabilitySchedule?.endTime || "",
      message: values.availabilitySchedule?.message?.trim() || "",
    },
    addOns,
    options,
  };
};

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const toCouponEditor = (coupon) => ({
  id: coupon._id,
  values: {
    ...emptyCoupon,
    ...coupon,
    value: String(coupon.value ?? ""),
    minimumOrder: String(coupon.minimumOrder ?? 0),
    maxDiscount: coupon.maxDiscount ?? "",
    usageLimit: String(coupon.usageLimit ?? 0),
    perUserLimit: String(coupon.perUserLimit ?? 1),
    startsAt: toDateTimeInput(coupon.startsAt),
    expiresAt: toDateTimeInput(coupon.expiresAt),
  },
});

const createCouponPayload = (values) => ({
  code: values.code.trim().toUpperCase(),
  description: values.description.trim(),
  discountType: values.discountType,
  value: Number(values.value),
  minimumOrder: Number(values.minimumOrder || 0),
  maxDiscount:
    values.discountType === "percentage" && values.maxDiscount !== ""
      ? Number(values.maxDiscount)
      : null,
  usageLimit: Number(values.usageLimit || 0),
  perUserLimit: Number(values.perUserLimit || 0),
  isActive: values.isActive,
  startsAt: values.startsAt
    ? new Date(values.startsAt).toISOString()
    : new Date().toISOString(),
  expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
});

const toOfferEditor = (offer) => ({
  id: offer._id,
  values: {
    ...emptyOffer,
    ...offer,
    category: offer.category?._id || offer.category || "",
    products: (offer.products || []).map((product) => product._id || product),
    dealType: offer.dealType || "discount",
    value: String(offer.value ?? ""),
    buyQuantity: String(offer.buyQuantity ?? 1),
    getQuantity: String(offer.getQuantity ?? 1),
    comboPrice: offer.comboPrice ?? "",
    minimumOrder: String(offer.minimumOrder ?? 0),
    maxDiscount: offer.maxDiscount ?? "",
    priority: String(offer.priority ?? 0),
    startsAt: toDateTimeInput(offer.startsAt),
    expiresAt: toDateTimeInput(offer.expiresAt),
  },
});

const createOfferPayload = (values) => ({
  name: values.name.trim(),
  description: values.description.trim(),
  dealType: values.dealType,
  discountType: values.dealType === "discount" ? values.discountType : "fixed",
  value: values.dealType === "discount" ? Number(values.value) : 0,
  appliesTo: values.dealType === "combo" ? "products" : values.appliesTo,
  category: values.dealType !== "combo" && values.appliesTo === "category" ? values.category : null,
  products: values.appliesTo === "products" || values.dealType === "combo" ? values.products : [],
  buyQuantity: values.dealType === "buy_x_get_y" ? Number(values.buyQuantity || 1) : 1,
  getQuantity: values.dealType === "buy_x_get_y" ? Number(values.getQuantity || 1) : 1,
  comboPrice: values.dealType === "combo" ? Number(values.comboPrice || 0) : 0,
  minimumOrder: Number(values.minimumOrder || 0),
  maxDiscount:
    values.dealType === "discount" && values.discountType === "percentage" && values.maxDiscount !== ""
      ? Number(values.maxDiscount)
      : null,
  priority: Number(values.priority || 0),
  isActive: values.isActive,
  startsAt: values.startsAt
    ? new Date(values.startsAt).toISOString()
    : new Date().toISOString(),
  expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
});

const createBannerPayload = (values) => ({
  title: values.title.trim(),
  subtitle: values.subtitle.trim(),
  badge: values.badge.trim(),
  image: values.image.trim(),
  ctaLabel: values.ctaLabel.trim(),
  ctaLink: values.ctaLink.trim(),
  displayOrder: Number(values.displayOrder || 0),
  isActive: values.isActive !== false,
  startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
  endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
});

function App() {
  const [session, setSession] = useState(readAdminSession);
  const [view, setView] = useState("overview");
  const [toast, setToast] = useState(null);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productEditor, setProductEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [riderEditor, setRiderEditor] = useState(null);
  const [couponEditor, setCouponEditor] = useState(null);
  const [offerEditor, setOfferEditor] = useState(null);
  const [alertDialog, setAlertDialog] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [cancelEditor, setCancelEditor] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(20);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredOrdersTotal, setFilteredOrdersTotal] = useState(0);
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [unreadOrderIds, setUnreadOrderIds] = useState(() => new Set());
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackNewCount, setFeedbackNewCount] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackFilters, setFeedbackFilters] = useState({
    status: "all",
    type: "all",
    priority: "all",
    search: "",
  });
  const [customers, setCustomers] = useState([]);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [customerDetail, setCustomerDetail] = useState(null);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [deliverySettingsLoading, setDeliverySettingsLoading] = useState(false);
  const [reportRange, setReportRange] = useState("month");
  const [report, setReport] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminActivity, setAdminActivity] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const orderRequestRef = useRef(0);

  const logout = useCallback(() => {
    clearAdminSession();
    setSession(null);
    setProductEditor(null);
    setCategoryEditor(null);
    setRiderEditor(null);
    setCouponEditor(null);
    setOfferEditor(null);
    setAlertDialog(null);
    setConfirmation(null);
    setCancelEditor(null);
    setOrderDetails(null);
    setOrderFilter("all");
    setOrderPage(1);
    setOrderLimit(20);
    setOrderPagination({ page: 1, limit: 20, total: 0, pages: 1 });
    setFilteredOrders([]);
    setFilteredOrdersTotal(0);
    setUnreadOrderIds(new Set());
    setCoupons([]);
    setOffers([]);
    setBanners([]);
    setFeedback([]);
    setFeedbackTotal(0);
    setFeedbackNewCount(0);
    setFeedbackError("");
    setFeedbackFilters({
      status: "all",
      type: "all",
      priority: "all",
      search: "",
    });
    setCustomers([]);
    setCustomersTotal(0);
    setCustomersError("");
    setCustomerSearch("");
    setCustomerStatus("all");
    setCustomerDetail(null);
    setDeliverySettings(null);
    setReport(null);
    setReportsError("");
    setAdminUsers([]);
    setAdminActivity([]);
    setSecurityError("");
  }, []);

  const notify = useCallback((message, type = "success") => setToast({ message, type, id: Date.now() }), []);

  const updateSession = useCallback((nextSession) => {
    setSession((current) => {
      const updated = {
        ...(current || {}),
        ...nextSession,
        user: {
          ...(current?.user || {}),
          ...(nextSession?.user || {}),
        },
        token: nextSession?.token || current?.token,
      };
      saveAdminSession(updated);
      return updated;
    });
  }, []);

  const can = useCallback(
    (permission) => hasAdminPermission(session?.user, permission),
    [session?.user],
  );

  const syncAdminProfile = useCallback(
    (user) => updateSession({ user }),
    [updateSession],
  );

  const syncUnreadOrders = useCallback((ids = []) => {
    setUnreadOrderIds(
      new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []),
    );
  }, []);

  const workspace = useAdminWorkspace(session?.token, logout, syncAdminProfile, syncUnreadOrders);
  const { products, categories, orders, riders, setProducts, setOrders, loading, error, load, refreshOverview } = workspace;

  const loadCoupons = useCallback(async () => {
    if (!session?.token) return;
    if (!can("offers:manage")) {
      setCoupons([]);
      return;
    }
    setCouponsLoading(true);
    try {
      setCoupons(await adminApi.getCoupons(session.token));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else notify(requestError.message || "Could not load coupons.", "error");
    } finally {
      setCouponsLoading(false);
    }
  }, [can, logout, notify, session?.token]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const loadOffers = useCallback(async () => {
    if (!session?.token) return;
    if (!can("offers:manage")) {
      setOffers([]);
      return;
    }
    setOffersLoading(true);
    try {
      setOffers(await adminApi.getOffers(session.token));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else notify(requestError.message || "Could not load offers.", "error");
    } finally {
      setOffersLoading(false);
    }
  }, [can, logout, notify, session?.token]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const loadBanners = useCallback(async () => {
    if (!session?.token) return;
    if (!can("content:manage")) {
      setBanners([]);
      return;
    }
    setBannersLoading(true);
    try {
      const result = await adminApi.getBanners(session.token);
      setBanners(result.banners || []);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else notify(requestError.message || "Could not load hero banners.", "error");
    } finally {
      setBannersLoading(false);
    }
  }, [can, logout, notify, session?.token]);

  useEffect(() => {
    if (view === "banners") loadBanners();
  }, [loadBanners, view]);

  const loadFeedback = useCallback(async () => {
    if (!session?.token) return;
    if (!can("feedback:manage")) {
      setFeedback([]);
      setFeedbackTotal(0);
      setFeedbackNewCount(0);
      return;
    }
    setFeedbackLoading(true);
    setFeedbackError("");
    try {
      const result = await adminApi.getFeedback(session.token, feedbackFilters);
      setFeedback(result.feedback || []);
      setFeedbackTotal(result.pagination?.total || 0);
      setFeedbackNewCount(Number(result.newCount || 0));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else setFeedbackError(requestError.message || "Could not load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }, [can, feedbackFilters, logout, session?.token]);

  const loadFeedbackCount = useCallback(async () => {
    if (!session?.token) return;
    if (!can("feedback:manage")) {
      setFeedbackNewCount(0);
      return;
    }
    try {
      const result = await adminApi.getFeedback(session.token, { limit: 1 });
      setFeedbackNewCount(Number(result.newCount || 0));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
    }
  }, [can, logout, session?.token]);

  useEffect(() => {
    loadFeedbackCount();
  }, [loadFeedbackCount]);

  useEffect(() => {
    if (view !== "feedback") return undefined;
    const timer = window.setTimeout(loadFeedback, 250);
    return () => window.clearTimeout(timer);
  }, [loadFeedback, view]);

  const loadCustomers = useCallback(async () => {
    if (!session?.token) return;
    if (!can("customers:manage")) {
      setCustomers([]);
      setCustomersTotal(0);
      return;
    }
    setCustomersLoading(true);
    setCustomersError("");
    try {
      const result = await adminApi.getCustomers(session.token, {
        search: customerSearch,
        status: customerStatus,
      });
      setCustomers(result.customers || []);
      setCustomersTotal(result.pagination?.total || 0);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else setCustomersError(requestError.message || "Could not load customers.");
    } finally {
      setCustomersLoading(false);
    }
  }, [can, customerSearch, customerStatus, logout, session?.token]);

  useEffect(() => {
    if (view !== "customers") return undefined;
    const timer = window.setTimeout(loadCustomers, 250);
    return () => window.clearTimeout(timer);
  }, [loadCustomers, view]);

  const loadDeliverySettings = useCallback(async () => {
    if (!session?.token) return;
    if (!can("delivery:manage")) {
      setDeliverySettings(null);
      return;
    }
    setDeliverySettingsLoading(true);
    try {
      setDeliverySettings(await adminApi.getDeliverySettings(session.token));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else notify(requestError.message || "Could not load delivery settings.", "error");
    } finally {
      setDeliverySettingsLoading(false);
    }
  }, [can, logout, notify, session?.token]);

  useEffect(() => {
    loadDeliverySettings();
  }, [loadDeliverySettings]);

  const loadReports = useCallback(async () => {
    if (!session?.token) return;
    if (!can("reports:read")) {
      setReport(null);
      return;
    }
    setReportsLoading(true);
    setReportsError("");
    try {
      setReport(await adminApi.getReports(session.token, reportRange));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else setReportsError(requestError.message || "Could not load reports.");
    } finally {
      setReportsLoading(false);
    }
  }, [can, logout, reportRange, session?.token]);

  useEffect(() => {
    if (view === "reports") loadReports();
  }, [loadReports, view]);

  const loadSecurity = useCallback(async () => {
    if (!session?.token) return;
    setSecurityLoading(true);
    setSecurityError("");
    try {
      if (!can("security:manage")) {
        setAdminUsers([]);
        setAdminActivity([]);
        return;
      }
      const [adminResult, activityResult] = await Promise.all([
        adminApi.getAdminUsers(session.token),
        adminApi.getAdminActivity(session.token, 60),
      ]);
      setAdminUsers(adminResult.admins || []);
      setAdminActivity(activityResult.logs || []);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else setSecurityError(requestError.message || "Could not load security settings.");
    } finally {
      setSecurityLoading(false);
    }
  }, [can, logout, session?.token]);

  useEffect(() => {
    if (view === "security") loadSecurity();
  }, [loadSecurity, view]);

  useEffect(() => {
    if (view !== "reports") return undefined;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadReports();
    };
    const interval = window.setInterval(refreshWhenVisible, 60000);
    return () => window.clearInterval(interval);
  }, [loadReports, view]);

  const loadFilteredOrders = useCallback(async (filter, page = orderPage, limit = orderLimit) => {
    if (!session?.token) return;
    if (!can("orders:manage")) {
      setFilteredOrders([]);
      setFilteredOrdersTotal(0);
      setOrderPagination({ page: 1, limit, total: 0, pages: 1 });
      return;
    }
    const requestId = ++orderRequestRef.current;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const result = await adminApi.getOrders(session.token, {
        filter,
        page,
        limit,
      });
      if (requestId !== orderRequestRef.current) return;
      const pagination = {
        page: result.pagination?.page || page,
        limit: result.pagination?.limit || limit,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 1,
      };
      if (pagination.total > 0 && page > pagination.pages) {
        setOrderPage(pagination.pages);
        return;
      }
      setFilteredOrders(result.orders || []);
      setFilteredOrdersTotal(pagination.total);
      setOrderPagination(pagination);
      syncUnreadOrders(result.unreadOrderIds || []);
    } catch (requestError) {
      if (requestId !== orderRequestRef.current) return;
      if (requestError.status === 401 || requestError.status === 403) logout();
      else setOrdersError(requestError.message || "Could not load orders.");
    } finally {
      if (requestId === orderRequestRef.current) setOrdersLoading(false);
    }
  }, [can, logout, orderLimit, orderPage, session?.token, syncUnreadOrders]);

  const handleOrderCreated = useCallback((order) => {
    if (!order?._id) return;
    if (!can("orders:manage")) return;
    setOrders((current) => [order, ...current.filter((entry) => entry._id !== order._id)].slice(0, 100));
    if (view === "orders") loadFilteredOrders(orderFilter, orderPage, orderLimit);
    setUnreadOrderIds((current) => new Set(current).add(order._id));
    notify(`New order ${shortId(order._id)} received.`, "info");
  }, [can, loadFilteredOrders, notify, orderFilter, orderLimit, orderPage, setOrders, view]);

  const handleOrderUpdated = useCallback((order) => {
    if (!order?._id) return;
    const applyUpdate = (current) => current._id === order._id ? { ...current, ...order } : current;
    setOrders((current) => current.map(applyUpdate));
    setOrderDetails((current) => current?._id === order._id ? { ...current, ...order } : current);
    if (view === "orders") loadFilteredOrders(orderFilter, orderPage, orderLimit);
  }, [loadFilteredOrders, orderFilter, orderLimit, orderPage, setOrders, view]);

  const handleStockAlert = useCallback(({ product, kind }) => {
    if (!product?._id) return;
    setProducts((current) => current.map((entry) => entry._id === product._id ? { ...entry, ...product } : entry));
    notify(
      kind === "out_of_stock"
        ? `${product.name} is now out of stock.`
        : `Low stock: ${product.name} has ${product.stock} left.`,
      kind === "out_of_stock" ? "error" : "warning",
    );
  }, [notify, setProducts]);

  const handleStockRestored = useCallback(({ product, quantity }) => {
    if (!product?._id) return;
    setProducts((current) => current.map((entry) => entry._id === product._id ? { ...entry, ...product } : entry));
    notify(`${product.name} stock restored by ${quantity}. Current stock ${product.stock}.`, "info");
  }, [notify, setProducts]);

  const handleFeedbackCreated = useCallback((feedbackItem) => {
    if (!feedbackItem?._id) return;
    if (!can("feedback:manage")) return;
    setFeedbackNewCount((current) => current + 1);
    if (view === "feedback") loadFeedback();
    notify(`New ${feedbackItem.type || "feedback"} received.`, "info");
  }, [can, loadFeedback, notify, view]);

  const realtimeConnected = useOrderNotifications(
    session?.token,
    handleOrderCreated,
    handleOrderUpdated,
    handleStockAlert,
    handleStockRestored,
    handleFeedbackCreated,
  );

  useEffect(() => {
    if (!toast) return undefined;
    const attentionToast = ["info", "warning", "error"].includes(toast.type);
    const timer = window.setTimeout(() => setToast(null), attentionToast ? 8000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (view !== "overview" || orderDetails) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshOverview();
    };

    const interval = window.setInterval(refreshWhenVisible, 60000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [orderDetails, refreshOverview, view]);

  useEffect(() => {
    if (view !== "coupons" || couponEditor) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadCoupons();
    };

    const interval = window.setInterval(refreshWhenVisible, 60000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [couponEditor, loadCoupons, view]);

  useEffect(() => {
    if (view !== "offers" || offerEditor) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadOffers();
    };

    const interval = window.setInterval(refreshWhenVisible, 60000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadOffers, offerEditor, view]);

  useEffect(() => {
    if (view !== "customers" || customerDetail) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadCustomers();
    };

    const interval = window.setInterval(refreshWhenVisible, 60000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [customerDetail, loadCustomers, view]);

  useEffect(() => {
    if (view === "orders") loadFilteredOrders(orderFilter);
  }, [loadFilteredOrders, orderFilter, view]);

  useEffect(() => {
    const currentView = navigationItems.find(([id]) => id === view);
    if (currentView && !hasAdminPermission(session?.user, currentView[2])) {
      setView("overview");
    }
  }, [session?.user, view]);

  const markOrderRead = useCallback(async (orderId) => {
    setUnreadOrderIds((current) => {
      if (!current.has(orderId)) return current;
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
    if (!session?.token) return;
    try {
      const result = await adminApi.markOrderRead(orderId, session.token);
      syncUnreadOrders(result.unreadOrderIds || []);
    } catch (requestError) {
      notify(requestError.message || "Order read status could not be updated.", "error");
    }
  }, [notify, session?.token, syncUnreadOrders]);

  const metrics = useMemo(() => ({
    revenue: orders.filter((order) => order.orderStatus !== "cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0),
    activeOrders: orders.filter((order) => !["delivered", "cancelled"].includes(order.orderStatus)).length,
    products: products.length,
    lowStock: products.filter((product) => Number(product.stock) <= 5).length,
  }), [orders, products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesText = [product.name, product.description, ...(product.tags || [])].join(" ").toLowerCase().includes(productQuery.toLowerCase());
    return matchesText && (categoryFilter === "all" || productCategoryId(product) === categoryFilter);
  }), [products, productQuery, categoryFilter]);

  const saveProduct = async (event) => {
    event.preventDefault();
    const editor = productEditor;
    const payload = createProductPayload(editor.values, products);
    if (!editor.id && (!payload.options.length || payload.price <= 0)) {
      notify("Add at least one size option with a valid price.", "error");
      return;
    }
    if (payload.isComboMeal && !payload.comboItems.length) {
      notify("Select at least one product inside this combo meal.", "error");
      return;
    }
    setBusyAction("product-save");
    try {
      const savedProduct = await adminApi.saveProduct(editor.id, payload, session.token);
      const previousStock = Number(
        products.find((product) => product._id === editor.id)?.stock,
      );
      const stockChanged =
        !Number.isFinite(previousStock) || previousStock !== Number(savedProduct.stock);
      const needsStockAlert = Number(savedProduct.stock) <= 5 && stockChanged;
      setProductEditor(null);
      notify(
        needsStockAlert
          ? Number(savedProduct.stock) === 0
            ? `${savedProduct.name} is now out of stock.`
            : `Low stock: ${savedProduct.name} has ${savedProduct.stock} left.`
          : editor.id
            ? "Product updated."
            : "Product added to menu.",
        needsStockAlert
          ? Number(savedProduct.stock) === 0
            ? "error"
            : "warning"
          : "success",
      );
      await load();
    } catch (requestError) {
      notify(requestError.message || "Product could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const exportProducts = async () => {
    setBusyAction("product-export");
    try {
      const exportedProducts = await adminApi.exportProducts(session.token);
      const blob = new Blob([JSON.stringify(exportedProducts, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `harmain-products-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Product export downloaded.");
    } catch (requestError) {
      notify(requestError.message || "Products could not be exported.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const importProducts = async (file) => {
    if (!file) return;
    setBusyAction("product-import");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const productsToImport = Array.isArray(parsed) ? parsed : parsed.products;
      if (!Array.isArray(productsToImport))
        throw new Error("Import file must contain a products array.");
      const result = await adminApi.importProducts(productsToImport, session.token);
      notify(
        `Import finished: ${result.created} created, ${result.updated} updated${result.failed ? `, ${result.failed} failed` : ""}.`,
        result.failed ? "warning" : "success",
      );
      await load();
    } catch (requestError) {
      notify(requestError.message || "Products could not be imported.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    const editor = couponEditor;
    const payload = createCouponPayload(editor.values);
    setBusyAction("coupon-save");
    try {
      await adminApi.saveCoupon(editor.id, payload, session.token);
      setCouponEditor(null);
      notify(editor.id ? "Coupon updated." : "Coupon created.");
      await loadCoupons();
    } catch (requestError) {
      notify(requestError.message || "Coupon could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const saveOffer = async (event) => {
    event.preventDefault();
    const editor = offerEditor;
    const payload = createOfferPayload(editor.values);
    setBusyAction("offer-save");
    try {
      await adminApi.saveOffer(editor.id, payload, session.token);
      setOfferEditor(null);
      notify(editor.id ? "Offer updated." : "Offer created.");
      await loadOffers();
    } catch (requestError) {
      if (requestError.status === 409) {
        setAlertDialog({
          title: "Offer conflict",
          message:
            requestError.message ||
            "This product already has an active offer. End that offer before adding another one.",
        });
      } else {
        notify(requestError.message || "Offer could not be saved.", "error");
      }
    } finally {
      setBusyAction("");
    }
  };

  const saveBanner = async (id, values) => {
    const payload = createBannerPayload(values);
    if (!payload.image) {
      notify("Banner image is required.", "error");
      return false;
    }
    if (payload.startsAt && payload.endsAt && new Date(payload.startsAt) > new Date(payload.endsAt)) {
      notify("Banner end date must be after start date.", "error");
      return false;
    }
    setBusyAction("banner-save");
    try {
      await adminApi.saveBanner(id, payload, session.token);
      notify(id ? "Hero banner updated." : "Hero banner created.");
      await loadBanners();
      return true;
    } catch (requestError) {
      notify(requestError.message || "Hero banner could not be saved.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const updateFeedback = async (feedbackId, values) => {
    setBusyAction(`feedback-${feedbackId}`);
    try {
      const result = await adminApi.updateFeedback(feedbackId, values, session.token);
      const updated = result.feedback || result;
      setFeedback((current) =>
        current.map((entry) => entry._id === feedbackId ? { ...entry, ...updated } : entry),
      );
      if (typeof result.newCount === "number") {
        setFeedbackNewCount(result.newCount);
      }
      notify("Feedback updated.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Feedback could not be updated.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const markFeedbackRead = async (feedbackId) => {
    setBusyAction(`feedback-read-${feedbackId}`);
    try {
      const result = await adminApi.markFeedbackRead(feedbackId, session.token);
      const updated = result.feedback || result;
      setFeedback((current) =>
        current.map((entry) => entry._id === feedbackId ? { ...entry, ...updated } : entry),
      );
      if (typeof result.newCount === "number") {
        setFeedbackNewCount(result.newCount);
      }
      notify("Feedback marked as read.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Feedback could not be marked as read.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const saveDeliverySettings = async (values) => {
    const payload = {
      isDeliveryEnabled: values.isDeliveryEnabled,
      deliveryFee: Number(values.deliveryFee || 0),
      freeDeliveryAbove: Number(values.freeDeliveryAbove || 0),
      minimumOrder: Number(values.minimumOrder || 0),
      estimatedMinutes: Number(values.estimatedMinutes || 0),
      note: values.note.trim(),
      branches: values.branches || [],
    };
    setBusyAction("delivery-settings-save");
    try {
      setDeliverySettings(await adminApi.saveDeliverySettings(payload, session.token));
      notify("Delivery settings updated.");
    } catch (requestError) {
      notify(requestError.message || "Delivery settings could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const editor = categoryEditor;
    const payload = { ...editor.values, name: editor.values.name.trim(), description: editor.values.description.trim(), image: editor.values.image.trim() };
    setBusyAction("category-save");
    try {
      await adminApi.saveCategory(editor.id, payload, session.token);
      setCategoryEditor(null);
      notify(editor.id ? "Category updated." : "Category created.");
      await load();
    } catch (requestError) {
      notify(requestError.message || "Category could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const saveRider = async (event) => {
    event.preventDefault();
    const editor = riderEditor;
    const values = editor.values;
    const payload = { name: values.name.trim(), phone: values.phone.trim(), isActive: values.isActive };
    if (!editor.id) {
      payload.email = values.email.trim();
      payload.password = values.password;
    }
    setBusyAction("rider-save");
    try {
      if (editor.id) await adminApi.updateRider(editor.id, payload, session.token);
      else await adminApi.createRider(payload, session.token);
      setRiderEditor(null);
      notify(editor.id ? "Delivery person updated." : "Delivery person added.");
      await load();
    } catch (requestError) {
      notify(requestError.message || "Delivery person could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const confirmDelete = async () => {
    const item = confirmation;
    if (!item) return;
    setConfirmation(null);
    const isProduct = item.entity === "product";
    const isCoupon = item.entity === "coupon";
    const isOffer = item.entity === "offer";
    const isBanner = item.entity === "banner";
    setBusyAction(`${item.entity}-${item.record._id}`);
    try {
      if (isProduct) await adminApi.deleteProduct(item.record._id, session.token);
      else if (isCoupon) await adminApi.deleteCoupon(item.record._id, session.token);
      else if (isOffer) await adminApi.deleteOffer(item.record._id, session.token);
      else if (isBanner) await adminApi.deleteBanner(item.record._id, session.token);
      else await adminApi.deleteCategory(item.record._id, session.token);
      notify(isProduct ? "Product deleted." : isCoupon ? "Coupon deleted." : isOffer ? "Offer deleted." : isBanner ? "Hero banner deleted." : "Category deleted.");
      if (isCoupon) await loadCoupons();
      else if (isOffer) await loadOffers();
      else if (isBanner) await loadBanners();
      else await load();
    } catch (requestError) {
      notify(requestError.message || "Item could not be deleted.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const updateOrder = async (orderId, changes) => {
    setBusyAction(`order-${orderId}`);
    try {
      const updated = await adminApi.updateOrder(orderId, changes, session.token);
      const applyUpdate = (order) => order._id === orderId ? { ...order, ...updated } : order;
      setOrders((current) => current.map(applyUpdate));
      setFilteredOrders((current) => current.map(applyUpdate));
      setOrderDetails((current) => current?._id === orderId ? { ...current, ...updated } : current);
      if (view === "orders") await loadFilteredOrders(orderFilter, orderPage, orderLimit);
      notify("Order updated.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Order could not be updated.", "error");
      await load();
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const saveCancellation = async (changes) => {
    if (!cancelEditor) return;
    const saved = await updateOrder(cancelEditor.order._id, changes);
    if (saved) setCancelEditor(null);
  };

  const assignRider = async (orderId, riderId) => {
    setBusyAction(`rider-${orderId}`);
    try {
      const updated = await adminApi.assignRider(orderId, riderId, session.token);
      const applyAssignment = (order) => order._id === orderId ? { ...order, ...updated, user: order.user } : order;
      setOrders((current) => current.map(applyAssignment));
      setFilteredOrders((current) => current.map(applyAssignment));
      setOrderDetails((current) => current?._id === orderId ? { ...current, ...updated, user: current.user } : current);
      notify(updated.assignedRider ? `${updated.assignedRider.name} assigned to order.` : "Rider unassigned from order.");
    } catch (requestError) {
      notify(requestError.message || "Rider could not be assigned.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const applyCustomerUpdate = (customer) => {
    if (!customer?._id) return;
    setCustomers((current) =>
      current.map((entry) => entry._id === customer._id ? { ...entry, ...customer } : entry),
    );
    setCustomerDetail((current) =>
      current?.customer?._id === customer._id
        ? { ...current, customer: { ...current.customer, ...customer } }
        : current,
    );
  };

  const openCustomer = async (customerId) => {
    setCustomerDetail({
      customer: customers.find((customer) => customer._id === customerId) || null,
      orders: [],
    });
    setCustomerDetailLoading(true);
    try {
      setCustomerDetail(await adminApi.getCustomer(customerId, session.token));
    } catch (requestError) {
      notify(requestError.message || "Customer profile could not be loaded.", "error");
      setCustomerDetail(null);
    } finally {
      setCustomerDetailLoading(false);
    }
  };

  const saveCustomerLoyalty = async (customerId, payload) => {
    setBusyAction(`customer-loyalty-${customerId}`);
    try {
      const result = await adminApi.updateCustomerLoyalty(customerId, payload, session.token);
      applyCustomerUpdate(result.customer);
      notify("Loyalty discount updated.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Loyalty discount could not be saved.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const addCustomerNote = async (customerId, text) => {
    if (!text.trim()) {
      notify("Write a note first.", "error");
      return false;
    }
    setBusyAction(`customer-note-${customerId}`);
    try {
      const result = await adminApi.addCustomerNote(customerId, text.trim(), session.token);
      setCustomerDetail((current) =>
        current?.customer?._id === customerId
          ? {
              ...current,
              customer: {
                ...current.customer,
                customerNotes: result.notes || [],
              },
            }
          : current,
      );
      setCustomers((current) =>
        current.map((customer) =>
          customer._id === customerId
            ? { ...customer, customerNotes: result.notes || [] }
            : customer,
        ),
      );
      notify("Customer note added.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Customer note could not be added.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const deleteCustomerNote = async (customerId, noteId) => {
    setBusyAction(`customer-note-delete-${noteId}`);
    try {
      const result = await adminApi.deleteCustomerNote(customerId, noteId, session.token);
      setCustomerDetail((current) =>
        current?.customer?._id === customerId
          ? {
              ...current,
              customer: {
                ...current.customer,
                customerNotes: result.notes || [],
              },
            }
          : current,
      );
      notify("Customer note deleted.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Customer note could not be deleted.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const toggleCustomerBlock = async (customerId, payload) => {
    setBusyAction(`customer-status-${customerId}`);
    try {
      const result = await adminApi.updateCustomerStatus(customerId, payload, session.token);
      applyCustomerUpdate(result.customer);
      notify(result.customer?.isActive ? "Customer unblocked." : "Customer blocked.");
      return true;
    } catch (requestError) {
      notify(requestError.message || "Customer status could not be updated.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const createAdminUser = async (values) => {
    setBusyAction("admin-user-create");
    try {
      const result = await adminApi.createAdminUser(values, session.token);
      setAdminUsers((current) => [result.admin, ...current.filter((admin) => admin._id !== result.admin._id)]);
      notify("Admin user created.");
      await loadSecurity();
      return true;
    } catch (requestError) {
      notify(requestError.message || "Admin user could not be created.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const updateAdminUser = async (adminId, values) => {
    setBusyAction(`admin-user-${adminId}`);
    try {
      const result = await adminApi.updateAdminUser(adminId, values, session.token);
      setAdminUsers((current) =>
        current.map((admin) => (admin._id === adminId ? result.admin : admin)),
      );
      notify("Admin user updated.");
      await loadSecurity();
      return true;
    } catch (requestError) {
      notify(requestError.message || "Admin user could not be updated.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const changePassword = async (values) => {
    setBusyAction("admin-password-change");
    try {
      const result = await adminApi.changePassword(values, session.token);
      updateSession(result);
      notify("Password changed and old sessions were invalidated.");
      await loadSecurity();
      return true;
    } catch (requestError) {
      notify(requestError.message || "Password could not be changed.", "error");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const logoutAllSessions = async () => {
    setBusyAction("admin-logout-all");
    try {
      await adminApi.logoutAllSessions(session.token);
      logout();
    } catch (requestError) {
      notify(requestError.message || "Sessions could not be signed out.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const changeOrderFilter = (nextFilter) => {
    setOrderFilter(nextFilter);
    setOrderPage(1);
  };

  const changeOrderLimit = (nextLimit) => {
    setOrderLimit(Number(nextLimit) || 20);
    setOrderPage(1);
  };

  if (!session) return <LoginScreen onLogin={setSession} />;

  const requestDelete = (entity, record) => setConfirmation({
    entity,
    record,
    title: `Delete ${entity === "coupon" ? record.code : record.name || record.title || "banner"}?`,
    message: entity === "product" ? "This product will be permanently removed from the menu and cannot be recovered." : entity === "coupon" ? "This coupon will no longer be available at checkout. This action cannot be undone." : entity === "offer" ? "This automatic offer will no longer be available at checkout. This action cannot be undone." : entity === "banner" ? "This hero banner will be removed from the homepage slider. This action cannot be undone." : "Delete this category only after its products have been reassigned. This action cannot be undone.",
  });

  const viewLoading = view === "orders" ? ordersLoading : view === "coupons" ? couponsLoading : view === "offers" ? offersLoading : view === "banners" ? bannersLoading : view === "feedback" ? feedbackLoading : view === "customers" ? customersLoading : view === "delivery" ? deliverySettingsLoading : view === "reports" ? reportsLoading : view === "security" ? securityLoading : loading;
  const refreshView = view === "orders" ? () => loadFilteredOrders(orderFilter, orderPage, orderLimit) : view === "coupons" ? loadCoupons : view === "offers" ? loadOffers : view === "banners" ? loadBanners : view === "feedback" ? loadFeedback : view === "customers" ? loadCustomers : view === "delivery" ? loadDeliverySettings : view === "reports" ? loadReports : view === "security" ? loadSecurity : load;

  return (
    <>
      <AdminShell session={session} view={view} onViewChange={setView} onLogout={logout} loading={viewLoading} onRefresh={refreshView} newOrderCount={unreadOrderIds.size} newFeedbackCount={feedbackNewCount} realtimeConnected={realtimeConnected}>
        {error && <div className="mt-5 flex items-center justify-between gap-4 border-l-4 border-brand-600 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700"><span>{error}</span><button className="text-xs font-extrabold underline" onClick={load}>Try again</button></div>}
        {view === "overview" && <OverviewPage metrics={metrics} orders={orders} products={products} unreadOrderIds={unreadOrderIds} onMarkOrderRead={markOrderRead} onNavigate={setView} onOpenOrder={setOrderDetails} />}
        {view === "products" && <ProductsPage products={filteredProducts} categories={categories} query={productQuery} categoryFilter={categoryFilter} onQueryChange={setProductQuery} onCategoryFilterChange={setCategoryFilter} onNew={() => setProductEditor({ id: null, values: { ...emptyProduct(categories[0]?._id || ""), options: [{ clientId: newOptionId(), name: "Regular", actualPrice: "", discountPrice: "", tag: "" }] } })} onEdit={(product) => setProductEditor(toProductEditor(product))} onDelete={(product) => requestDelete("product", product)} onExport={exportProducts} onImport={importProducts} busyAction={busyAction} />}
        {view === "categories" && <CategoriesPage categories={categories} products={products} onNew={() => setCategoryEditor({ id: null, values: emptyCategory })} onEdit={(category) => setCategoryEditor({ id: category._id, values: { ...emptyCategory, ...category } })} onDelete={(category) => requestDelete("category", category)} busyAction={busyAction} />}
        {view === "orders" && <OrdersPage orders={filteredOrders} total={filteredOrdersTotal} pagination={orderPagination} page={orderPage} limit={orderLimit} filter={orderFilter} unreadOrderIds={unreadOrderIds} onMarkOrderRead={markOrderRead} onFilterChange={changeOrderFilter} onPageChange={setOrderPage} onLimitChange={changeOrderLimit} onUpdate={updateOrder} onCancel={(order) => setCancelEditor({ order })} onOpenOrder={setOrderDetails} busyAction={busyAction} loading={ordersLoading} error={ordersError} />}
        {view === "reports" && <ReportsPage report={report} range={reportRange} onRangeChange={setReportRange} loading={reportsLoading} error={reportsError} />}
        {view === "customers" && <CustomersPage customers={customers} total={customersTotal} search={customerSearch} status={customerStatus} loading={customersLoading} error={customersError} selectedDetail={customerDetail} detailLoading={customerDetailLoading} busyAction={busyAction} onSearchChange={setCustomerSearch} onStatusChange={setCustomerStatus} onOpenCustomer={openCustomer} onCloseCustomer={() => setCustomerDetail(null)} onSaveLoyalty={saveCustomerLoyalty} onAddNote={addCustomerNote} onDeleteNote={deleteCustomerNote} onToggleBlock={toggleCustomerBlock} />}
        {view === "coupons" && <CouponsPage coupons={coupons} onNew={() => setCouponEditor({ id: null, values: { ...emptyCoupon, startsAt: toDateTimeInput(new Date()) } })} onEdit={(coupon) => setCouponEditor(toCouponEditor(coupon))} onDelete={(coupon) => requestDelete("coupon", coupon)} busyAction={busyAction} />}
        {view === "offers" && <OffersPage offers={offers} onNew={() => setOfferEditor({ id: null, values: { ...emptyOffer, startsAt: toDateTimeInput(new Date()) } })} onEdit={(offer) => setOfferEditor(toOfferEditor(offer))} onDelete={(offer) => requestDelete("offer", offer)} busyAction={busyAction} />}
        {view === "banners" && <HeroBannersPage banners={banners} loading={bannersLoading} busyAction={busyAction} onSave={saveBanner} onDelete={(banner) => requestDelete("banner", banner)} />}
        {view === "feedback" && <FeedbackPage feedback={feedback} total={feedbackTotal} filters={feedbackFilters} loading={feedbackLoading} error={feedbackError} busyAction={busyAction} onFilterChange={setFeedbackFilters} onUpdate={updateFeedback} onMarkRead={markFeedbackRead} />}
        {view === "delivery" && <DeliverySettingsPage settings={deliverySettings} loading={deliverySettingsLoading} onSave={saveDeliverySettings} busy={busyAction === "delivery-settings-save"} />}
        {view === "riders" && <RidersPage riders={riders} onNew={() => setRiderEditor({ id: null, values: emptyRider })} onEdit={(rider) => setRiderEditor({ id: rider._id, values: { ...emptyRider, ...rider, password: "" } })} />}
        {view === "security" && <SecurityPage session={session} admins={adminUsers} activity={adminActivity} emptyAdmin={emptyAdminUser} loading={securityLoading} error={securityError} busyAction={busyAction} canManageSecurity={can("security:manage")} onRefresh={loadSecurity} onCreateAdmin={createAdminUser} onUpdateAdmin={updateAdminUser} onChangePassword={changePassword} onLogoutAllSessions={logoutAllSessions} />}
      </AdminShell>
      {productEditor && <ProductEditor editor={productEditor} categories={categories} products={products} onChange={setProductEditor} onClose={() => setProductEditor(null)} onSave={saveProduct} busy={busyAction === "product-save"} />}
      {categoryEditor && <CategoryEditor editor={categoryEditor} onChange={setCategoryEditor} onClose={() => setCategoryEditor(null)} onSave={saveCategory} busy={busyAction === "category-save"} />}
      {couponEditor && <CouponEditor editor={couponEditor} onChange={setCouponEditor} onClose={() => setCouponEditor(null)} onSave={saveCoupon} busy={busyAction === "coupon-save"} />}
      {offerEditor && <OfferEditor editor={offerEditor} categories={categories} products={products} onChange={setOfferEditor} onClose={() => setOfferEditor(null)} onSave={saveOffer} busy={busyAction === "offer-save"} />}
      {riderEditor && <RiderEditor editor={riderEditor} onChange={setRiderEditor} onClose={() => setRiderEditor(null)} onSave={saveRider} busy={busyAction === "rider-save"} />}
      {cancelEditor && <CancelOrderModal order={cancelEditor.order} onClose={() => setCancelEditor(null)} onConfirm={saveCancellation} busy={busyAction === `order-${cancelEditor.order._id}`} />}
      {alertDialog && <AlertDialog title={alertDialog.title} message={alertDialog.message} onClose={() => setAlertDialog(null)} />}
      {confirmation && <ConfirmDialog title={confirmation.title} message={confirmation.message} onCancel={() => setConfirmation(null)} onConfirm={confirmDelete} />}
      {orderDetails && <OrderDetailsModal order={orderDetails} riders={riders} onAssignRider={assignRider} assigning={busyAction === `rider-${orderDetails._id}`} onUpdateOrder={updateOrder} updatingOrder={busyAction === `order-${orderDetails._id}`} onClose={() => setOrderDetails(null)} />}
      <Toast toast={toast} />
    </>
  );
}

export default App;
