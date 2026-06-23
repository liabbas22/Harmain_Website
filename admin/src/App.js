import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "./api/adminApi";
import { emptyCategory, emptyProduct } from "./constants/admin";
import AdminShell from "./components/layout/AdminShell";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import Toast from "./components/ui/Toast";
import LoginScreen from "./features/auth/LoginScreen";
import CategoriesPage from "./features/categories/CategoriesPage";
import CategoryEditor from "./features/categories/CategoryEditor";
import OverviewPage from "./features/dashboard/OverviewPage";
import OrdersPage from "./features/orders/OrdersPage";
import OrderDetailsModal from "./features/orders/OrderDetailsModal";
import ProductEditor from "./features/products/ProductEditor";
import ProductsPage from "./features/products/ProductsPage";
import { useAdminWorkspace } from "./hooks/useAdminWorkspace";
import { productCategoryId } from "./utils/format";
import { clearAdminSession, readAdminSession } from "./utils/session";

const newOptionId = () => `${Date.now()}-${Math.random()}`;

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

function App() {
  const [session, setSession] = useState(readAdminSession);
  const [view, setView] = useState("overview");
  const [toast, setToast] = useState(null);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productEditor, setProductEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [busyAction, setBusyAction] = useState("");

  const logout = useCallback(() => {
    clearAdminSession();
    setSession(null);
    setProductEditor(null);
    setCategoryEditor(null);
    setConfirmation(null);
    setOrderDetails(null);
  }, []);

  const workspace = useAdminWorkspace(session?.token, logout);
  const { products, categories, orders, setOrders, loading, error, load } = workspace;

  const notify = useCallback((message, type = "success") => setToast({ message, type, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
      await adminApi.saveProduct(editor.id, payload, session.token);
      setProductEditor(null);
      notify(editor.id ? "Product updated." : "Product added to menu.");
      await load();
    } catch (requestError) {
      notify(requestError.message || "Product could not be saved.", "error");
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

  const confirmDelete = async () => {
    const item = confirmation;
    if (!item) return;
    setConfirmation(null);
    const isProduct = item.entity === "product";
    setBusyAction(`${item.entity}-${item.record._id}`);
    try {
      if (isProduct) await adminApi.deleteProduct(item.record._id, session.token);
      else await adminApi.deleteCategory(item.record._id, session.token);
      notify(isProduct ? "Product deleted." : "Category deleted.");
      await load();
    } catch (requestError) {
      notify(requestError.message || "Item could not be deleted.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const updateOrder = async (orderId, changes) => {
    setBusyAction(`order-${orderId}`);
    try {
      await adminApi.updateOrder(orderId, changes, session.token);
      setOrders((current) => current.map((order) => order._id === orderId ? { ...order, ...changes } : order));
      setOrderDetails((current) => current?._id === orderId ? { ...current, ...changes } : current);
      notify("Order updated.");
    } catch (requestError) {
      notify(requestError.message || "Order could not be updated.", "error");
      await load();
    } finally {
      setBusyAction("");
    }
  };

  if (!session) return <LoginScreen onLogin={setSession} />;

  const requestDelete = (entity, record) => setConfirmation({
    entity,
    record,
    title: `Delete ${record.name}?`,
    message: entity === "product" ? "This product will be permanently removed from the menu and cannot be recovered." : "Delete this category only after its products have been reassigned. This action cannot be undone.",
  });

  return <><AdminShell session={session} view={view} onViewChange={setView} onLogout={logout} loading={loading} onRefresh={load}>{error && <div className="mt-5 flex items-center justify-between gap-4 border-l-4 border-brand-600 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700"><span>{error}</span><button className="text-xs font-extrabold underline" onClick={load}>Try again</button></div>}{view === "overview" && <OverviewPage metrics={metrics} orders={orders} products={products} onNavigate={setView} onOpenOrder={setOrderDetails} />}{view === "products" && <ProductsPage products={filteredProducts} categories={categories} query={productQuery} categoryFilter={categoryFilter} onQueryChange={setProductQuery} onCategoryFilterChange={setCategoryFilter} onNew={() => setProductEditor({ id: null, values: emptyProduct(categories[0]?._id || "") })} onEdit={(product) => setProductEditor(toProductEditor(product))} onDelete={(product) => requestDelete("product", product)} busyAction={busyAction} />}{view === "categories" && <CategoriesPage categories={categories} products={products} onNew={() => setCategoryEditor({ id: null, values: emptyCategory })} onEdit={(category) => setCategoryEditor({ id: category._id, values: { ...emptyCategory, ...category } })} onDelete={(category) => requestDelete("category", category)} busyAction={busyAction} />}{view === "orders" && <OrdersPage orders={orders} onUpdate={updateOrder} onOpenOrder={setOrderDetails} busyAction={busyAction} />}</AdminShell>{productEditor && <ProductEditor editor={productEditor} categories={categories} onChange={setProductEditor} onClose={() => setProductEditor(null)} onSave={saveProduct} busy={busyAction === "product-save"} />}{categoryEditor && <CategoryEditor editor={categoryEditor} onChange={setCategoryEditor} onClose={() => setCategoryEditor(null)} onSave={saveCategory} busy={busyAction === "category-save"} />}{confirmation && <ConfirmDialog title={confirmation.title} message={confirmation.message} onCancel={() => setConfirmation(null)} onConfirm={confirmDelete} />}{orderDetails && <OrderDetailsModal order={orderDetails} onClose={() => setOrderDetails(null)} />}<Toast toast={toast} /></>;
}

export default App;
