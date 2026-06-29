const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export async function request(path, { method = "GET", body, token } = {}) {
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
}

export const adminApi = {
  login: (email, password) =>
    request("/auth/admin/login", { method: "POST", body: { email, password } }),
  getProfile: (token) => request("/auth/admin/me", { token }),
  getProducts: (token) => request("/products?limit=100", { token }),
  getCategories: (token) => request("/categories?all=true", { token }),
  getOrders: (token, filter = "all") => request(`/orders?limit=100&filter=${encodeURIComponent(filter)}`, { token }),
  getReports: (token, range = "month") => request(`/reports?range=${encodeURIComponent(range)}`, { token }),
  getRiders: (token) => request("/auth/admin/riders", { token }),
  getCoupons: (token) => request("/coupons", { token }),
  getOffers: (token) => request("/offers", { token }),
  getCustomers: (token, { search = "", status = "all" } = {}) =>
    request(
      `/customers?limit=100&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
      { token },
    ),
  getCustomer: (id, token) => request(`/customers/${id}`, { token }),
  updateCustomerStatus: (id, body, token) =>
    request(`/customers/${id}/status`, { method: "PATCH", body, token }),
  updateCustomerLoyalty: (id, body, token) =>
    request(`/customers/${id}/loyalty`, { method: "PATCH", body, token }),
  addCustomerNote: (id, text, token) =>
    request(`/customers/${id}/notes`, { method: "POST", body: { text }, token }),
  deleteCustomerNote: (id, noteId, token) =>
    request(`/customers/${id}/notes/${noteId}`, { method: "DELETE", token }),
  getDeliverySettings: (token) => request("/settings/delivery", { token }),
  saveDeliverySettings: (body, token) =>
    request("/settings/delivery", { method: "PATCH", body, token }),
  createRider: (body, token) => request("/auth/admin/riders", { method: "POST", body, token }),
  updateRider: (id, body, token) => request(`/auth/admin/riders/${id}`, { method: "PATCH", body, token }),
  saveProduct: (id, body, token) =>
    request(id ? `/products/${id}` : "/products", {
      method: id ? "PATCH" : "POST",
      body,
      token,
    }),
  deleteProduct: (id, token) =>
    request(`/products/${id}`, { method: "DELETE", token }),
  exportProducts: (token) => request("/products/admin/export", { token }),
  importProducts: (products, token) =>
    request("/products/admin/import", { method: "POST", body: { products }, token }),
  saveCoupon: (id, body, token) =>
    request(id ? `/coupons/${id}` : "/coupons", {
      method: id ? "PATCH" : "POST",
      body,
      token,
    }),
  deleteCoupon: (id, token) =>
    request(`/coupons/${id}`, { method: "DELETE", token }),
  saveOffer: (id, body, token) =>
    request(id ? `/offers/${id}` : "/offers", {
      method: id ? "PATCH" : "POST",
      body,
      token,
    }),
  deleteOffer: (id, token) =>
    request(`/offers/${id}`, { method: "DELETE", token }),
  saveCategory: (id, body, token) =>
    request(id ? `/categories/${id}` : "/categories", {
      method: id ? "PATCH" : "POST",
      body,
      token,
    }),
  deleteCategory: (id, token) =>
    request(`/categories/${id}`, { method: "DELETE", token }),
  updateOrder: (id, body, token) =>
    request(`/orders/${id}/status`, { method: "PATCH", body, token }),
  assignRider: (id, riderId, token) =>
    request(`/orders/${id}/rider`, { method: "PATCH", body: { riderId: riderId || null }, token }),
};
