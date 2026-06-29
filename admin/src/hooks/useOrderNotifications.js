import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export function useOrderNotifications(token, onOrderCreated, onOrderUpdated, onStockAlert, onStockRestored) {
  const [connected, setConnected] = useState(false);
  const createdHandlerRef = useRef(onOrderCreated);
  const updatedHandlerRef = useRef(onOrderUpdated);
  const stockAlertHandlerRef = useRef(onStockAlert);
  const stockRestoredHandlerRef = useRef(onStockRestored);

  useEffect(() => {
    createdHandlerRef.current = onOrderCreated;
  }, [onOrderCreated]);

  useEffect(() => {
    updatedHandlerRef.current = onOrderUpdated;
  }, [onOrderUpdated]);

  useEffect(() => {
    stockAlertHandlerRef.current = onStockAlert;
  }, [onStockAlert]);

  useEffect(() => {
    stockRestoredHandlerRef.current = onStockRestored;
  }, [onStockRestored]);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("order:created", ({ order }) => createdHandlerRef.current?.(order));
    socket.on("order:updated", ({ order }) => updatedHandlerRef.current?.(order));
    socket.on("stock:alert", (alert) => stockAlertHandlerRef.current?.(alert));
    socket.on("stock:restored", (event) => stockRestoredHandlerRef.current?.(event));

    return () => socket.disconnect();
  }, [token]);

  return connected;
}
