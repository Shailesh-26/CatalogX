import axios from "axios";
import { clearAuth } from "./auth";

// Set REACT_APP_API_URL in frontend/.env to point at a different backend
// (restart `npm start` after changing it).
export const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

const AUTH_PAGES = ["/login", "/signup", "/verify-email", "/forgot-password", "/public"];

// 401 = token missing/expired → back to login (once, not in a loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && !AUTH_PAGES.includes(window.location.pathname)) {
      clearAuth();
      window.location.href = "/login?expired=1";
    }
    if (status === 403) {
      console.warn("Access denied:", error.response?.data?.message);
    }
    if (!error.response) {
      // Backend not running / network error — make the message useful
      error.friendlyMessage = `Can't reach the server at ${API_BASE}. Is the backend running?`;
    }
    return Promise.reject(error);
  }
);

// Pull the best human-readable message out of an axios error
export const errMsg = (err, fallback = "Please try again.") =>
  err?.response?.data?.message || err?.friendlyMessage || fallback;

export default api;
