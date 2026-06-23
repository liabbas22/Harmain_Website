import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const ADMIN_SESSION_KEY = "harmain_admin_session";
const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const emptyProduct = (category = "") => ({
  name: "",
  description: "",
  price: "",
  category,
  image: "",
  stock: "0",
  tags: "",
  isAvailable: true,
  options: [],
});

const emptyCategory = { name: "", description: "", image: "", isActive: true };

const readSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

const request = async (path, { method = "GET", body, token } = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return data;
};

const money = (value) =>
  `Rs. ${new Intl.NumberFormat("en-PK").format(Number(value || 0))}`;
const title = (value = "") =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
const shortId = (value = "") => `#${value.slice(-6).toUpperCase()}`;
const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request("/auth/admin/login", {
        method: "POST",
        body: { email, password },
      });
      if (data.user?.role !== "admin")
        throw new Error("This account does not have administrator access.");
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data));
      onLogin(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Admin sign in">
        <div className="brand-mark" aria-hidden="true">
          HS
        </div>
        <p className="eyebrow">Harmain Sharfain</p>
        <h1>Restaurant control room</h1>
        <p className="muted">
          Sign in with an administrator account to manage menu and orders.
        </p>
        <form className="login-form" onSubmit={submit}>
          <label>
            <span>Email address</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="quiet-button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button login-submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in securely"}
          </button>
        </form>
      </section>
      <aside className="login-aside">
        <div>
          <p className="eyebrow">Private operations</p>
          <h2>Keep the kitchen, menu, and orders in rhythm.</h2>
        </div>
        <div className="login-points">
          <span>Menu availability and stock</span>
          <span>Order progress and payment status</span>
          <span>Admin-only access verified by server</span>
        </div>
      </aside>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(readSession);
  const [view, setView] = useState("overview");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productEditor, setProductEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [busyAction, setBusyAction] = useState("");

  const token = session?.token;

  const notify = (message, type = "success") =>
    setToast({ message, type, id: Date.now() });
  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setSession(null);
    setProducts([]);
    setCategories([]);
    setOrders([]);
  };

  const loadWorkspace = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
      const [profile, productResult, categoryResult, orderResult] =
        await Promise.all([
          request("/auth/admin/me", { token }),
          request("/products?limit=100", { token }),
          request("/categories?all=true", { token }),
          request("/orders?limit=100", { token }),
        ]);
      if (profile.user?.role !== "admin")
        throw new Error("Administrator access is required.");
      setProducts(productResult.products || []);
      setCategories(categoryResult || []);
      setOrders(orderResult.orders || []);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) logout();
      else
        setLoadError(
          requestError.message || "Could not load the admin workspace.",
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.orderStatus),
    );
    const revenue = orders
      .filter((order) => order.orderStatus !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    return {
      revenue,
      activeOrders: activeOrders.length,
      products: products.length,
      lowStock: products.filter((product) => Number(product.stock) <= 5).length,
    };
  }, [orders, products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesText = [
          product.name,
          product.description,
          ...(product.tags || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(productQuery.toLowerCase());
        const productCategory = product.category?._id || product.category;
        return (
          matchesText &&
          (categoryFilter === "all" || productCategory === categoryFilter)
        );
      }),
    [products, productQuery, categoryFilter],
  );

  const saveProduct = async (event) => {
    event.preventDefault();
    const editor = productEditor;
    const cleanedOptions = editor.values.options
      .filter((option) => option.name.trim() && option.actualPrice !== "")
      .map((option) => ({
        name: option.name.trim(),
        actualPrice: Number(option.actualPrice),
        ...(option.discountPrice !== ""
          ? { discountPrice: Number(option.discountPrice) }
          : {}),
        tag: option.tag.trim(),
      }));
    const payload = {
      ...editor.values,
      name: editor.values.name.trim(),
      description: editor.values.description.trim(),
      image: editor.values.image.trim(),
      price: Number(editor.values.price),
      stock: Number(editor.values.stock || 0),
      tags: editor.values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      options: cleanedOptions,
    };
    setBusyAction("product-save");
    try {
      await request(editor.id ? `/products/${editor.id}` : "/products", {
        method: editor.id ? "PATCH" : "POST",
        body: payload,
        token,
      });
      setProductEditor(null);
      notify(editor.id ? "Product updated." : "Product added to menu.");
      await loadWorkspace();
    } catch (requestError) {
      notify(requestError.message || "Product could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const deleteProduct = async (product) => {
    setBusyAction(`product-${product._id}`);
    try {
      await request(`/products/${product._id}`, { method: "DELETE", token });
      notify("Product deleted.");
      await loadWorkspace();
    } catch (requestError) {
      notify(requestError.message || "Product could not be deleted.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const editor = categoryEditor;
    const payload = {
      ...editor.values,
      name: editor.values.name.trim(),
      description: editor.values.description.trim(),
      image: editor.values.image.trim(),
    };
    setBusyAction("category-save");
    try {
      await request(editor.id ? `/categories/${editor.id}` : "/categories", {
        method: editor.id ? "PATCH" : "POST",
        body: payload,
        token,
      });
      setCategoryEditor(null);
      notify(editor.id ? "Category updated." : "Category created.");
      await loadWorkspace();
    } catch (requestError) {
      notify(requestError.message || "Category could not be saved.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const deleteCategory = async (category) => {
    setBusyAction(`category-${category._id}`);
    try {
      await request(`/categories/${category._id}`, { method: "DELETE", token });
      notify("Category deleted.");
      await loadWorkspace();
    } catch (requestError) {
      notify(requestError.message || "Category could not be deleted.", "error");
    } finally {
      setBusyAction("");
    }
  };

  const updateOrder = async (orderId, changes) => {
    setBusyAction(`order-${orderId}`);
    try {
      await request(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: changes,
        token,
      });
      setOrders((current) =>
        current.map((order) =>
          order._id === orderId ? { ...order, ...changes } : order,
        ),
      );
      setOrderDetails((current) =>
        current?._id === orderId ? { ...current, ...changes } : current,
      );
      notify("Order updated.");
    } catch (requestError) {
      notify(requestError.message || "Order could not be updated.", "error");
      await loadWorkspace();
    } finally {
      setBusyAction("");
    }
  };

  const confirmDelete = () => {
    if (!confirmation) return;
    const { entity, record } = confirmation;
    setConfirmation(null);
    if (entity === "product") deleteProduct(record);
    if (entity === "category") deleteCategory(record);
  };

  if (!session) return <LoginScreen onLogin={setSession} />;

  const navigation = [
    ["overview", "Overview"],
    ["products", "Products"],
    ["categories", "Categories"],
    ["orders", "Orders"],
  ];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark small" aria-hidden="true">
            HS
          </span>
          <span>Harmain Admin</span>
        </div>
        <nav aria-label="Admin navigation">
          {navigation.map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "nav-item active" : "nav-item"}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="admin-avatar">
            {session.user?.name?.slice(0, 1).toUpperCase() || "A"}
          </span>
          <div>
            <strong>{session.user?.name || "Administrator"}</strong>
            <small>{session.user?.email}</small>
          </div>
          <button className="text-action" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>{title(view)}</h1>
          </div>
          <div className="topbar-actions">
            <span className="live-indicator">Live data</span>
            <button
              className="secondary-button"
              onClick={loadWorkspace}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {loadError && (
          <div className="page-error">
            <span>{loadError}</span>
            <button className="text-action" onClick={loadWorkspace}>
              Try again
            </button>
          </div>
        )}

        {view === "overview" && (
          <Overview
            metrics={metrics}
            orders={orders}
            products={products}
            onNavigate={setView}
            onOpenOrder={setOrderDetails}
          />
        )}
        {view === "products" && (
          <Products
            products={filteredProducts}
            categories={categories}
            query={productQuery}
            categoryFilter={categoryFilter}
            setQuery={setProductQuery}
            setCategoryFilter={setCategoryFilter}
            onNew={() =>
              setProductEditor({
                id: null,
                values: emptyProduct(categories[0]?._id || ""),
              })
            }
            onEdit={(product) =>
              setProductEditor({
                id: product._id,
                values: {
                  ...emptyProduct(product.category?._id || product.category),
                  ...product,
                  category: product.category?._id || product.category,
                  stock: String(product.stock ?? 0),
                  tags: (product.tags || []).join(", "),
                  options: (product.options || []).map((option) => ({
                    ...option,
                    actualPrice: String(option.actualPrice ?? ""),
                    discountPrice: option.discountPrice ?? "",
                    tag: option.tag || "",
                  })),
                },
              })
            }
            onDelete={(product) =>
              setConfirmation({
                entity: "product",
                record: product,
                title: `Delete ${product.name}?`,
                message:
                  "This product will be permanently removed from the menu and cannot be recovered.",
              })
            }
            busyAction={busyAction}
          />
        )}
        {view === "categories" && (
          <Categories
            categories={categories}
            products={products}
            onNew={() => setCategoryEditor({ id: null, values: emptyCategory })}
            onEdit={(category) =>
              setCategoryEditor({
                id: category._id,
                values: { ...emptyCategory, ...category },
              })
            }
            onDelete={(category) =>
              setConfirmation({
                entity: "category",
                record: category,
                title: `Delete ${category.name}?`,
                message:
                  "Delete this category only after its products have been reassigned. This action cannot be undone.",
              })
            }
            busyAction={busyAction}
          />
        )}
        {view === "orders" && (
          <Orders
            orders={orders}
            onUpdate={updateOrder}
            onOpenOrder={setOrderDetails}
            busyAction={busyAction}
          />
        )}
      </main>

      {productEditor && (
        <ProductEditor
          editor={productEditor}
          categories={categories}
          setEditor={setProductEditor}
          onClose={() => setProductEditor(null)}
          onSave={saveProduct}
          busy={busyAction === "product-save"}
        />
      )}
      {categoryEditor && (
        <CategoryEditor
          editor={categoryEditor}
          setEditor={setCategoryEditor}
          onClose={() => setCategoryEditor(null)}
          onSave={saveCategory}
          busy={busyAction === "category-save"}
        />
      )}
      {confirmation && (
        <ConfirmationDialog
          title={confirmation.title}
          message={confirmation.message}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmDelete}
        />
      )}
      {orderDetails && (
        <OrderDetailsModal
          order={orderDetails}
          onClose={() => setOrderDetails(null)}
        />
      )}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Overview({ metrics, orders, products, onNavigate, onOpenOrder }) {
  const latestOrders = orders.slice(0, 6);
  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.orderStatus === status).length,
  }));
  const maxCount = Math.max(...statusCounts.map((item) => item.count), 1);
  return (
    <div className="page-stack">
      <section className="metric-grid">
        <article className="metric-card">
          <span>Order value</span>
          <strong>{money(metrics.revenue)}</strong>
          <small>All non-cancelled orders</small>
        </article>
        <article className="metric-card">
          <span>Open orders</span>
          <strong>{metrics.activeOrders}</strong>
          <small>Awaiting completion</small>
        </article>
        <article className="metric-card">
          <span>Menu products</span>
          <strong>{metrics.products}</strong>
          <small>Current catalogue</small>
        </article>
        <article className="metric-card accent">
          <span>Low stock</span>
          <strong>{metrics.lowStock}</strong>
          <small>Five units or fewer</small>
        </article>
      </section>
      <section className="content-grid overview-grid">
        <article className="panel order-flow">
          <div className="panel-heading">
            <div>
              <h2>Order flow</h2>
              <p>Current order distribution</p>
            </div>
            <button
              className="text-action"
              onClick={() => onNavigate("orders")}
            >
              View orders
            </button>
          </div>
          <div className="status-bars">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="status-bar">
                <span>{title(status)}</span>
                <div>
                  <i style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
        </article>
        <article className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Stock watch</h2>
              <p>Items that need attention</p>
            </div>
            <button
              className="text-action"
              onClick={() => onNavigate("products")}
            >
              Manage menu
            </button>
          </div>
          {products
            .filter((product) => Number(product.stock) <= 5)
            .slice(0, 5)
            .map((product) => (
              <div className="stock-row" key={product._id}>
                <span className="product-thumb">
                  {product.image ? (
                    <img src={product.image} alt="" />
                  ) : (
                    product.name.slice(0, 1)
                  )}
                </span>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.category?.name || "Uncategorised"}</small>
                </div>
                <b
                  className={
                    Number(product.stock) === 0 ? "stock-empty" : "stock-low"
                  }
                >
                  {Number(product.stock)} left
                </b>
              </div>
            ))}
          {!products.some((product) => Number(product.stock) <= 5) && (
            <p className="empty-inline">No low-stock products right now.</p>
          )}
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent orders</h2>
            <p>Latest customer activity</p>
          </div>
          <button className="text-action" onClick={() => onNavigate("orders")}>
            Open queue
          </button>
        </div>
        <OrderTable orders={latestOrders} compact onOpenOrder={onOpenOrder} />
      </section>
    </div>
  );
}

function Products({
  products,
  categories,
  query,
  categoryFilter,
  setQuery,
  setCategoryFilter,
  onNew,
  onEdit,
  onDelete,
  busyAction,
}) {
  return (
    <div className="page-stack">
      <section className="toolbar">
        <div className="filter-fields">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option value={category._id} key={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-button" onClick={onNew}>
          Add product
        </button>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>Menu catalogue</h2>
            <p>{products.length} products match the current filters</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Availability</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-cell">
                      <span className="product-thumb">
                        {product.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          product.name.slice(0, 1)
                        )}
                      </span>
                      <div>
                        <strong>{product.name}</strong>
                        <small>
                          {product.options?.length
                            ? `${product.options.length} price options`
                            : product.description || "No description"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name || "-"}</td>
                  <td>{money(product.price)}</td>
                  <td>
                    <span
                      className={Number(product.stock) <= 5 ? "stock-low" : ""}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        product.isAvailable
                          ? "status available"
                          : "status unavailable"
                      }
                    >
                      {product.isAvailable ? "Available" : "Hidden"}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="text-action"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="danger-action"
                      disabled={busyAction === `product-${product._id}`}
                      onClick={() => onDelete(product)}
                    >
                      {busyAction === `product-${product._id}`
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Categories({
  categories,
  products,
  onNew,
  onEdit,
  onDelete,
  busyAction,
}) {
  return (
    <div className="page-stack">
      <section className="toolbar">
        <div>
          <h2 className="toolbar-title">Menu categories</h2>
          <p className="toolbar-copy">Organise customer-facing menu groups.</p>
        </div>
        <button className="primary-button" onClick={onNew}>
          Add category
        </button>
      </section>
      <section className="category-grid">
        {categories.map((category) => {
          const count = products.filter(
            (product) =>
              (product.category?._id || product.category) === category._id,
          ).length;
          return (
            <article className="category-card" key={category._id}>
              <div className="category-card-top">
                <span className="category-image">
                  {category.image ? (
                    <img src={category.image} alt="" />
                  ) : (
                    category.name.slice(0, 1)
                  )}
                </span>
                <span
                  className={
                    category.isActive
                      ? "status available"
                      : "status unavailable"
                  }
                >
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h2>{category.name}</h2>
              <p>{category.description || "No category description."}</p>
              <div className="category-card-footer">
                <span>{count} products</span>
                <div>
                  <button
                    className="text-action"
                    onClick={() => onEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-action"
                    disabled={busyAction === `category-${category._id}`}
                    onClick={() => onDelete(category)}
                  >
                    {busyAction === `category-${category._id}`
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {!categories.length && (
          <div className="panel empty-state">
            No categories have been created yet.
          </div>
        )}
      </section>
    </div>
  );
}

function Orders({ orders, onUpdate, onOpenOrder, busyAction }) {
  return (
    <div className="page-stack">
      <section className="toolbar">
        <div>
          <h2 className="toolbar-title">Order queue</h2>
          <p className="toolbar-copy">
            Update order progress and payment verification.
          </p>
        </div>
        <span className="order-count">{orders.length} orders</span>
      </section>
      <section className="panel table-panel">
        <div className="table-scroll">
          <OrderTable
            orders={orders}
            onUpdate={onUpdate}
            onOpenOrder={onOpenOrder}
            busyAction={busyAction}
          />
        </div>
      </section>
    </div>
  );
}

function OrderTable({
  orders,
  onUpdate,
  onOpenOrder,
  busyAction,
  compact = false,
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          {!compact && <th>Items</th>}
          <th>Total</th>
          <th>Status</th>
          {!compact && <th>Payment</th>}
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            className="order-row"
            key={order._id}
            tabIndex="0"
            onClick={(event) => {
              if (!event.target.closest("select")) onOpenOrder?.(order);
            }}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onOpenOrder?.(order);
              }
            }}
          >
            <td>
              <strong>{shortId(order._id)}</strong>
            </td>
            <td>
              <div className="customer-cell">
                <strong>
                  {order.user?.name ||
                    order.deliveryAddress?.fullName ||
                    "Customer"}
                </strong>
                <small>
                  {order.user?.email || order.deliveryAddress?.phone || "-"}
                </small>
              </div>
            </td>
            {!compact && (
              <td>
                {order.items?.reduce((sum, item) => sum + item.quantity, 0) ||
                  0}{" "}
                items
              </td>
            )}
            <td>
              <strong>{money(order.total)}</strong>
            </td>
            <td>
              {compact ? (
                <span className={`status order-${order.orderStatus}`}>
                  {title(order.orderStatus)}
                </span>
              ) : (
                <select
                  value={order.orderStatus}
                  disabled={busyAction === `order-${order._id}`}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    onUpdate(order._id, { orderStatus: event.target.value })
                  }
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {title(status)}
                    </option>
                  ))}
                </select>
              )}
            </td>
            {!compact && (
              <td>
                <select
                  value={order.paymentStatus}
                  disabled={busyAction === `order-${order._id}`}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    onUpdate(order._id, { paymentStatus: event.target.value })
                  }
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {title(status)}
                    </option>
                  ))}
                </select>
              </td>
            )}
            <td>
              <small>{dateTime(order.createdAt)}</small>
            </td>
          </tr>
        ))}
        {!orders.length && (
          <tr>
            <td colSpan={compact ? "5" : "7"} className="empty-cell">
              No orders are available yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ProductEditor({
  editor,
  categories,
  setEditor,
  onClose,
  onSave,
  busy,
}) {
  const update = (key, value) =>
    setEditor((current) => ({
      ...current,
      values: { ...current.values, [key]: value },
    }));
  const updateOption = (index, key, value) =>
    setEditor((current) => ({
      ...current,
      values: {
        ...current.values,
        options: current.values.options.map((option, optionIndex) =>
          optionIndex === index ? { ...option, [key]: value } : option,
        ),
      },
    }));
  return (
    <Modal title={editor.id ? "Edit product" : "Add product"} onClose={onClose}>
      <form className="editor-form" onSubmit={onSave}>
        <div className="form-grid">
          <label>
            <span>Product name</span>
            <input
              value={editor.values.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Category</span>
            <select
              value={editor.values.category}
              onChange={(event) => update("category", event.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Base price</span>
            <input
              min="0"
              type="number"
              value={editor.values.price}
              onChange={(event) => update("price", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Stock units</span>
            <input
              min="0"
              type="number"
              value={editor.values.stock}
              onChange={(event) => update("stock", event.target.value)}
              required
            />
          </label>
          <label className="full">
            <span>Image URL</span>
            <input
              type="url"
              value={editor.values.image}
              onChange={(event) => update("image", event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="full">
            <span>Description</span>
            <textarea
              value={editor.values.description}
              onChange={(event) => update("description", event.target.value)}
              rows="3"
            />
          </label>
          <label className="full">
            <span>Tags</span>
            <input
              value={editor.values.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="popular, spicy, pizza"
            />
          </label>
          <label className="toggle-field">
            <input
              checked={editor.values.isAvailable}
              onChange={(event) => update("isAvailable", event.target.checked)}
              type="checkbox"
            />
            <span>Show this product to customers</span>
          </label>
        </div>
        <div className="option-editor">
          <div className="option-heading">
            <div>
              <h3>Size and price options</h3>
              <p>Optional. Customers can select these on the menu.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                update("options", [
                  ...editor.values.options,
                  { name: "", actualPrice: "", discountPrice: "", tag: "" },
                ])
              }
            >
              Add option
            </button>
          </div>
          {editor.values.options.map((option, index) => (
            <div className="option-row" key={index}>
              <input
                value={option.name}
                onChange={(event) =>
                  updateOption(index, "name", event.target.value)
                }
                placeholder="Size"
              />
              <input
                value={option.actualPrice}
                onChange={(event) =>
                  updateOption(index, "actualPrice", event.target.value)
                }
                type="number"
                min="0"
                placeholder="Actual price"
              />
              <input
                value={option.discountPrice}
                onChange={(event) =>
                  updateOption(index, "discountPrice", event.target.value)
                }
                type="number"
                min="0"
                placeholder="Sale price"
              />
              <input
                value={option.tag}
                onChange={(event) =>
                  updateOption(index, "tag", event.target.value)
                }
                placeholder="Tag"
              />
              <button
                type="button"
                className="remove-button"
                onClick={() =>
                  update(
                    "options",
                    editor.values.options.filter(
                      (_, optionIndex) => optionIndex !== index,
                    ),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryEditor({ editor, setEditor, onClose, onSave, busy }) {
  const update = (key, value) =>
    setEditor((current) => ({
      ...current,
      values: { ...current.values, [key]: value },
    }));
  return (
    <Modal
      title={editor.id ? "Edit category" : "Add category"}
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={onSave}>
        <div className="form-grid">
          <label>
            <span>Category name</span>
            <input
              value={editor.values.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Image URL</span>
            <input
              type="url"
              value={editor.values.image}
              onChange={(event) => update("image", event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="full">
            <span>Description</span>
            <textarea
              value={editor.values.description}
              onChange={(event) => update("description", event.target.value)}
              rows="4"
            />
          </label>
          <label className="toggle-field">
            <input
              checked={editor.values.isActive}
              onChange={(event) => update("isActive", event.target.checked)}
              type="checkbox"
            />
            <span>Keep this category active</span>
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving..." : "Save category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title: modalTitle, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{modalTitle}</h2>
          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ConfirmationDialog({
  title: dialogTitle,
  message,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="modal-backdrop confirmation-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={dialogTitle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="confirmation-mark" aria-hidden="true">
          !
        </span>
        <h2>{dialogTitle}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function OrderDetailsModal({ order, onClose }) {
  const address = order.deliveryAddress || {};
  const addressLines = [
    address.line1,
    address.line2,
    address.area,
    address.city,
  ].filter(Boolean);
  const items = order.items || [];
  return (
    <div
      className="modal-backdrop order-details-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${shortId(order._id)} details`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Order details</p>
            <h2>{shortId(order._id)}</h2>
          </div>
          <button
            className="bg-red-700 close-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="order-details-body">
          <section className="order-summary-strip">
            <div>
              <span>Order status</span>
              <b className={`status order-${order.orderStatus}`}>
                {title(order.orderStatus)}
              </b>
            </div>
            <div>
              <span>Payment</span>
              <b>{title(order.paymentStatus || "pending")}</b>
            </div>
            <div>
              <span>Placed</span>
              <b>{dateTime(order.createdAt)}</b>
            </div>
          </section>
          <div className="order-detail-grid">
            <section>
              <h3>Customer</h3>
              <p>
                <strong>
                  {order.user?.name || address.fullName || "Customer"}
                </strong>
              </p>
              <p>{order.user?.email || "No email available"}</p>
              <p>{address.phone || "No phone available"}</p>
            </section>
            <section>
              <h3>Delivery address</h3>
              <p>{address.fullName || "-"}</p>
              <p>
                {addressLines.length
                  ? addressLines.join(", ")
                  : "No delivery address available"}
              </p>
              {address.instructions && (
                <p className="order-note">Note: {address.instructions}</p>
              )}
            </section>
          </div>
          <section className="order-items-section">
            <div className="order-items-heading">
              <h3>Items ordered</h3>
              <span>
                {items.reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0,
                )}{" "}
                items
              </span>
            </div>
            {items?.map((item, index) => (
              <article
                className="order-item"
                key={`${item.product || item.name}-${index}`}
              >
                <span className="order-item-image">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    item.name?.slice(0, 1)
                  )}
                </span>
                <div className="order-item-info">
                  <strong>{item.name || "Menu item"}</strong>
                  {item.optionName && <small>{item.optionName}</small>}
                </div>
                <span className="order-item-quantity">x{item.quantity}</span>
                <b>
                  {money(Number(item.price || 0) * Number(item.quantity || 0))}
                </b>
              </article>
            ))}
          </section>
          <section className="order-total">
            <span>Subtotal</span>
            <b>{money(order.subtotal)}</b>
            <span>Delivery fee</span>
            <b>{money(order.deliveryFee)}</b>
            <strong>Grand total</strong>
            <strong>{money(order.total)}</strong>
          </section>
        </div>
      </section>
    </div>
  );
}

export default App;
