import axios from "axios";

// Base URL — change this if deploying
const BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 globally — token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
  localStorage.clear();
  window.location.href = "/login";
}

if (error.response?.status === 403) {
      console.warn(
        "Access denied:",
        error.response?.data?.message
      );
    }
    return Promise.reject(error);
  }
);



export default api;