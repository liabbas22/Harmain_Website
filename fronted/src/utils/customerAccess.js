import api from "../api";

export const BLOCKED_ACCOUNT_MESSAGE =
  "Your account is currently blocked. Please contact Harmain support before placing or updating an order.";

export const notifyAccountBlocked = (message = BLOCKED_ACCOUNT_MESSAGE) => {
  window.dispatchEvent(
    new CustomEvent("harmain-account-blocked", {
      detail: { message },
    }),
  );
};

export const isBlockedAccountError = (error) => {
  const message = error?.response?.data?.message || "";
  return error?.response?.status === 403 && /blocked|account/i.test(message);
};

export const ensureActiveCustomer = async () => {
  const token = localStorage.getItem("harmain_token");
  if (!token) return { ok: false, reason: "unauthenticated" };

  try {
    const { data } = await api.get("/auth/me");
    const user = data.user;
    if (user?.isActive === false) {
      notifyAccountBlocked();
      return { ok: false, reason: "blocked" };
    }
    if (user) {
      localStorage.setItem("harmain_user", JSON.stringify(user));
      window.dispatchEvent(new Event("harmain-user-updated"));
    }
    return { ok: true, user };
  } catch (error) {
    if (isBlockedAccountError(error)) {
      notifyAccountBlocked(error.response?.data?.message);
      return { ok: false, reason: "blocked" };
    }
    if (error?.response?.status === 401) {
      localStorage.removeItem("harmain_token");
      localStorage.removeItem("harmain_user");
      window.dispatchEvent(new Event("harmain-user-updated"));
      return { ok: false, reason: "unauthenticated" };
    }
    return { ok: false, reason: "unknown" };
  }
};
