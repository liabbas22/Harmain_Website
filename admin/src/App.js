import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "./api/adminApi";
import { emptyCategory, emptyCoupon, emptyProduct, emptyRider } from "./constants/admin";
import AdminShell from "./components/layout/AdminShell";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import Toast from "./components/ui/Toast";
import LoginScreen from "./features/auth/LoginScreen";
import CategoriesPage from "./features/categories/CategoriesPage";
import CategoryEditor from "./features/categories/CategoryEditor";
import CouponEditor from "./features/coupons/CouponEditor";
import CouponsPage from "./features/coupons/CouponsPage";
import OverviewPage from "./features/dashboard/OverviewPage";
import CancelOrderModal from "./features/orders/CancelOrderModal";
import OrdersPage from "./features/orders/OrdersPage";
import OrderDetailsModal from "./features/orders/OrderDetailsModal";
import RiderEditor from "./features/riders/RiderEditor";
import RidersPage from "./features/riders/RidersPage";
import ProductEditor from "./features/products/ProductEditor";
import ProductsPage from "./features/products/ProductsPage";
import { useAdminWorkspace } from "./hooks/useAdminWorkspace";
import { useOrderNotifications } from "./hooks/useOrderNotifications";
import { productCategoryId, shortId } from "./utils/format";
import { clearAdminSession, readAdminSession } from "./utils/session";

const newOptionId = () => `${Date.now()}-${Math.random()}`;
const unreadOrderStorageKey = (userId) => `harmain_admin_unread_orders_${userId}`;

const toProductEditor = (product) => ({
  id: product._id,
  values: {
    ...emptyProduct(productCategoryId(product)),
    ...product,
    category: productCategoryId(product),
    stock: String(product.stock ?? 0),
    tags: (product.tags || []).join(", "),
    options: (product.options || []).map((option, index) => ({
      ...option,
      clientId: option._id || `option-${index}-${newOptionId()}`,
      actualPrice: String(option.actualPrice ?? ""),
      discountPrice: option.discountPrice ?? "",
      tag: option.tag || "",
    })),
  },
});

const createProductPayload = (values) => {
  const options = values.options
    .filter((option) => option.name.trim() && option.actualPrice !== "")
    .map((option) => ({
      name: option.name.trim(),
      actualPrice: Number(option.actualPrice),
      ...(option.discountPrice !== "" ? { discountPrice: Number(option.discountPrice) } : {}),
      tag: option.tag.trim(),
    }));
  const firstOption = options[0];
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    image: values.image.trim(),
    category: values.category,
    price: firstOption?.discountPrice ?? firstOption?.actualPrice ?? Number(values.price || 0),
    stock: Number(values.stock || 0),
    tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    isAvailable: values.isAvailable,
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
  const [confirmation, setConfirmation] = useState(null);
  const [cancelEditor, setCancelEditor] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredOrdersTotal, setFilteredOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [unreadOrderIds, setUnreadOrderIds] = useState(() => new Set());
  const [unreadOrdersOwner, setUnreadOrdersOwner] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const orderRequestRef = useRef(0);

  const logout = useCallback(() => {
    clearAdminSession();
    setSession(null);
    setProductEditor(null);
    setCategoryEditor(null);
    setRiderEditor(null);
    setCouponEditor(null);
    setConfirmation(null);
    setCancelEditor(null);
    setOrderDetails(null);
    setUnreadOrderIds(new Set());
    setUnreadOrdersOwner(null);
    setCoupons([]);
  }, []);

  const notify = useCallback((message, type = "success") => setToast({ message, type, id: Date.now() }), []);

  const workspace = useAdminWorkspace(session?.token, logout);
  const { products, categories, orders, riders, setProducts, setOrders, loading, error, load, refreshOverview } = workspace;

  const loadCoupons = useCallback(async () => {
    if (!session?.token) return;
    setCouponsLoading(true);
    try {
      setCoupons(await adminApi.getCoupons(session.token));
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else notify(requestError.message || "Could not load coupons.", "error");
    } finally {
      setCouponsLoading(false);
    }
  }, [logout, notify, session?.token]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const loadFilteredOrders = useCallback(async (filter) => {
    if (!session?.token) return;
    const requestId = ++orderRequestRef.current;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const result = await adminApi.getOrders(session.token, filter);
      if (requestId !== orderRequestRef.current) return;
      setFilteredOrders(result.orders || []);
      setFilteredOrdersTotal(result.pagination?.total || 0);
    } catch (requestError) {
      if (requestId !== orderRequestRef.current) return;
      if (requestError.status === 401 || requestError.status === 403) logout();
      else setOrdersError(requestError.message || "Could not load orders.");
    } finally {
      if (requestId === orderRequestRef.current) setOrdersLoading(false);
    }
  }, [logout, session?.token]);

  const handleOrderCreated = useCallback((order) => {
    if (!order?._id) return;
    setOrders((current) => [order, ...current.filter((entry) => entry._id !== order._id)].slice(0, 100));
    if (view === "orders") loadFilteredOrders(orderFilter);
    setUnreadOrderIds((current) => new Set(current).add(order._id));
    notify(`New order ${shortId(order._id)} received.`, "info");
  }, [loadFilteredOrders, notify, orderFilter, setOrders, view]);

  const handleOrderUpdated = useCallback((order) => {
    if (!order?._id) return;
    const applyUpdate = (current) => current._id === order._id ? { ...current, ...order } : current;
    setOrders((current) => current.map(applyUpdate));
    setOrderDetails((current) => current?._id === order._id ? { ...current, ...order } : current);
    if (view === "orders") loadFilteredOrders(orderFilter);
  }, [loadFilteredOrders, orderFilter, setOrders, view]);

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

  const realtimeConnected = useOrderNotifications(session?.token, handleOrderCreated, handleOrderUpdated, handleStockAlert);

  useEffect(() => {
    if (!toast) return undefined;
    const attentionToast = ["info", "warning", "error"].includes(toast.type);
    const timer = window.setTimeout(() => setToast(null), attentionToast ? 8000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setUnreadOrderIds(new Set());
      setUnreadOrdersOwner(null);
      return;
    }
    try {
      const savedIds = JSON.parse(localStorage.getItem(unreadOrderStorageKey(userId)) || "[]");
      setUnreadOrderIds(new Set(Array.isArray(savedIds) ? savedIds.filter((id) => typeof id === "string") : []));
    } catch {
      setUnreadOrderIds(new Set());
    }
    setUnreadOrdersOwner(userId);
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || unreadOrdersOwner !== userId) return;
    localStorage.setItem(unreadOrderStorageKey(userId), JSON.stringify([...unreadOrderIds]));
  }, [session?.user?.id, unreadOrderIds, unreadOrdersOwner]);

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
    if (view === "orders") loadFilteredOrders(orderFilter);
  }, [loadFilteredOrders, orderFilter, view]);

  const markOrderRead = useCallback((orderId) => {
    setUnreadOrderIds((current) => {
      if (!current.has(orderId)) return current;
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }, []);

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
    const payload = createProductPayload(editor.values);
    if (!editor.id && (!payload.options.length || payload.price <= 0)) {
      notify("Add at least one size option with a valid price.", "error");
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
    setBusyAction(`${item.entity}-${item.record._id}`);
    try {
      if (isProduct) await adminApi.deleteProduct(item.record._id, session.token);
      else if (isCoupon) await adminApi.deleteCoupon(item.record._id, session.token);
      else await adminApi.deleteCategory(item.record._id, session.token);
      notify(isProduct ? "Product deleted." : isCoupon ? "Coupon deleted." : "Category deleted.");
      if (isCoupon) await loadCoupons();
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
      if (view === "orders") await loadFilteredOrders(orderFilter);
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

  if (!session) return <LoginScreen onLogin={setSession} />;

  const requestDelete = (entity, record) => setConfirmation({
    entity,
    record,
    title: `Delete ${entity === "coupon" ? record.code : record.name}?`,
    message: entity === "product" ? "This product will be permanently removed from the menu and cannot be recovered." : entity === "coupon" ? "This coupon will no longer be available at checkout. This action cannot be undone." : "Delete this category only after its products have been reassigned. This action cannot be undone.",
  });

  const viewLoading = view === "orders" ? ordersLoading : view === "coupons" ? couponsLoading : loading;
  const refreshView = view === "orders" ? () => loadFilteredOrders(orderFilter) : view === "coupons" ? loadCoupons : load;

  return (
    <>
      <AdminShell session={session} view={view} onViewChange={setView} onLogout={logout} loading={viewLoading} onRefresh={refreshView} newOrderCount={unreadOrderIds.size} realtimeConnected={realtimeConnected}>
        {error && <div className="mt-5 flex items-center justify-between gap-4 border-l-4 border-brand-600 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700"><span>{error}</span><button className="text-xs font-extrabold underline" onClick={load}>Try again</button></div>}
        {view === "overview" && <OverviewPage metrics={metrics} orders={orders} products={products} unreadOrderIds={unreadOrderIds} onMarkOrderRead={markOrderRead} onNavigate={setView} onOpenOrder={setOrderDetails} />}
        {view === "products" && <ProductsPage products={filteredProducts} categories={categories} query={productQuery} categoryFilter={categoryFilter} onQueryChange={setProductQuery} onCategoryFilterChange={setCategoryFilter} onNew={() => setProductEditor({ id: null, values: emptyProduct(categories[0]?._id || "") })} onEdit={(product) => setProductEditor(toProductEditor(product))} onDelete={(product) => requestDelete("product", product)} busyAction={busyAction} />}
        {view === "categories" && <CategoriesPage categories={categories} products={products} onNew={() => setCategoryEditor({ id: null, values: emptyCategory })} onEdit={(category) => setCategoryEditor({ id: category._id, values: { ...emptyCategory, ...category } })} onDelete={(category) => requestDelete("category", category)} busyAction={busyAction} />}
        {view === "orders" && <OrdersPage orders={filteredOrders} total={filteredOrdersTotal} filter={orderFilter} unreadOrderIds={unreadOrderIds} onMarkOrderRead={markOrderRead} onFilterChange={setOrderFilter} onUpdate={updateOrder} onCancel={(order) => setCancelEditor({ order })} onOpenOrder={setOrderDetails} busyAction={busyAction} loading={ordersLoading} error={ordersError} />}
        {view === "coupons" && <CouponsPage coupons={coupons} onNew={() => setCouponEditor({ id: null, values: { ...emptyCoupon, startsAt: toDateTimeInput(new Date()) } })} onEdit={(coupon) => setCouponEditor(toCouponEditor(coupon))} onDelete={(coupon) => requestDelete("coupon", coupon)} busyAction={busyAction} />}
        {view === "riders" && <RidersPage riders={riders} onNew={() => setRiderEditor({ id: null, values: emptyRider })} onEdit={(rider) => setRiderEditor({ id: rider._id, values: { ...emptyRider, ...rider, password: "" } })} />}
      </AdminShell>
      {productEditor && <ProductEditor editor={productEditor} categories={categories} onChange={setProductEditor} onClose={() => setProductEditor(null)} onSave={saveProduct} busy={busyAction === "product-save"} />}
      {categoryEditor && <CategoryEditor editor={categoryEditor} onChange={setCategoryEditor} onClose={() => setCategoryEditor(null)} onSave={saveCategory} busy={busyAction === "category-save"} />}
      {couponEditor && <CouponEditor editor={couponEditor} onChange={setCouponEditor} onClose={() => setCouponEditor(null)} onSave={saveCoupon} busy={busyAction === "coupon-save"} />}
      {riderEditor && <RiderEditor editor={riderEditor} onChange={setRiderEditor} onClose={() => setRiderEditor(null)} onSave={saveRider} busy={busyAction === "rider-save"} />}
      {cancelEditor && <CancelOrderModal order={cancelEditor.order} onClose={() => setCancelEditor(null)} onConfirm={saveCancellation} busy={busyAction === `order-${cancelEditor.order._id}`} />}
      {confirmation && <ConfirmDialog title={confirmation.title} message={confirmation.message} onCancel={() => setConfirmation(null)} onConfirm={confirmDelete} />}
      {orderDetails && <OrderDetailsModal order={orderDetails} riders={riders} onAssignRider={assignRider} assigning={busyAction === `rider-${orderDetails._id}`} onUpdateOrder={updateOrder} updatingOrder={busyAction === `order-${orderDetails._id}`} onClose={() => setOrderDetails(null)} />}
      <Toast toast={toast} />
    </>
  );
}

export default App;
