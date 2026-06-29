import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../api/adminApi";
import { hasAdminPermission } from "../constants/admin";

export function useAdminWorkspace(token, onUnauthorized, onProfile) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const overviewRefreshingRef = useRef(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const profile = await adminApi.getProfile(token);
      if (profile.user?.role !== "admin") throw new Error("Administrator access is required.");
      onProfile?.(profile.user);

      const [productResult, categoryResult, orderResult, riderResult] = await Promise.all([
        hasAdminPermission(profile.user, "menu:manage")
          ? adminApi.getProducts(token)
          : Promise.resolve({ products: [] }),
        hasAdminPermission(profile.user, "menu:manage")
          ? adminApi.getCategories(token)
          : Promise.resolve([]),
        hasAdminPermission(profile.user, "orders:manage")
          ? adminApi.getOrders(token)
          : Promise.resolve({ orders: [] }),
        hasAdminPermission(profile.user, "riders:manage")
          ? adminApi.getRiders(token)
          : Promise.resolve([]),
      ]);
      setProducts(productResult.products || []);
      setCategories(categoryResult || []);
      setOrders(orderResult.orders || []);
      setRiders(riderResult || []);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) onUnauthorized();
      else setError(requestError.message || "Could not load the admin workspace.");
    } finally {
      setLoading(false);
    }
  }, [onProfile, onUnauthorized, token]);

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
    riders,
    setProducts,
    setCategories,
    setOrders,
    setRiders,
    loading,
    error,
    load,
    refreshOverview,
  };
}
