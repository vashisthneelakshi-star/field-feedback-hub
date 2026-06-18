import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// Attach Authorization header from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && localStorage.getItem("auth_token")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const SEGMENTS = [
  { key: "branch_head", label: "Branch Head" },
  { key: "circulation", label: "Circulation" },
  { key: "agent", label: "Agent" },
  { key: "hawker", label: "Hawker" },
  { key: "correspondent", label: "Correspondent" },
  { key: "advertisement", label: "Advt. Team" },
  { key: "ad_agency", label: "Ad Agency" },
  { key: "recovery", label: "Recovery" },
  { key: "summary", label: "Daily Summary" },
];
