import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../api/adminApi";

export function useAdminWorkspace(token, onUnauthorized) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const overviewRefreshingRef = useRef(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [profile, productResult, categoryResult, orderResult] = await Promise.all([
        adminApi.getProfile(token),
        adminApi.getProducts(token),
        adminApi.getCategories(token),
        adminApi.getOrders(token),
      ]);
      if (profile.user?.role !== "admin") throw new Error("Administrator access is required.");
      setProducts(productResult.products || []);
      setCategories(categoryResult || []);
      setOrders(orderResult.orders || []);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) onUnauthorized();
      else setError(requestError.message || "Could not load the admin workspace.");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, token]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshOverview = useCallback(async () => {
    if (!token || overviewRefreshingRef.current) return;
    overviewRefreshingRef.current = true;

    try {
      const [productResult, orderResult] = await Promise.all([
        adminApi.getProducts(token),
        adminApi.getOrders(token),
      ]);
      setProducts(productResult.products || []);
      setOrders(orderResult.orders || []);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) onUnauthorized();
      else setError(requestError.message || "Could not refresh overview data.");
    } finally {
      overviewRefreshingRef.current = false;
    }
  }, [onUnauthorized, token]);

  return {
    products,
    categories,
    orders,
    setProducts,
    setCategories,
    setOrders,
    loading,
    error,
    load,
    refreshOverview,
  };
}
