import { ADMIN_SESSION_KEY } from "../constants/admin";

export const readAdminSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

export const saveAdminSession = (session) =>
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

export const clearAdminSession = () => sessionStorage.removeItem(ADMIN_SESSION_KEY);
