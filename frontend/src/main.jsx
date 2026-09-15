import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import { Toaster } from "react-hot-toast";

import axios from "axios";

// Global interceptor for 401 session expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname === "/login" || window.location.pathname === "/signup" || window.location.pathname === "/";
      const isAuthOrIntegrationApi = error.config?.url?.includes("/api/auth/") || error.config?.url?.includes("/api/gmail/");
      if (!isAuthRoute && !isAuthOrIntegrationApi && localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("activeWorkspaceId");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className:
            "bg-surface dark:bg-surface-dark text-text-primary dark:text-text-darkPrimary border border-border dark:border-border-dark",
        }}
      />
      <App />
    </BrowserRouter>
  </StrictMode>
);