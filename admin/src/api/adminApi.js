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
  saveProduct: (id, body, token) =>
    request(id ? `/products/${id}` : "/products", {
      method: id ? "PATCH" : "POST",
      body,
      token,
    }),
  deleteProduct: (id, token) =>
    request(`/products/${id}`, { method: "DELETE", token }),
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
};
