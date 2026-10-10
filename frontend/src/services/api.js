import axios from 'axios';

// Base API instance
// In production: VITE_API_URL is set on Vercel (points to your Render backend)
// In development: falls back to /api which is proxied to localhost:5050
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token from localStorage if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusswap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Only clear if on protected pages
        // localStorage.removeItem('campusswap_token');
        // localStorage.removeItem('campusswap_user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
