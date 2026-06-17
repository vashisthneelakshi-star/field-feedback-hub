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
  { key: "branch_head", label: "Branch Head", hindi: "ब्रांच हेड" },
  { key: "circulation", label: "Circulation", hindi: "सर्कुलेशन" },
  { key: "agent", label: "Agent", hindi: "एजेंट" },
  { key: "hawker", label: "Hawker", hindi: "हॉकर" },
  { key: "correspondent", label: "Correspondent", hindi: "संवाददाता" },
  { key: "advertisement", label: "Advt. Team", hindi: "विज्ञापन" },
  { key: "ad_agency", label: "Ad Agency", hindi: "एड एजेंसी" },
  { key: "recovery", label: "Recovery", hindi: "रिकवरी" },
  { key: "summary", label: "Daily Summary", hindi: "डेली समरी" },
];
