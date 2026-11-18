import axios from 'axios';

// Direct backend endpoint to avoid Vite dev server http-proxy EPERM resolution issues
let rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5050/api';
rawUrl = rawUrl.trim().replace(/\/+$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl += '/api';
}
const API_BASE_URL = rawUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('people_ai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clear humanized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.error;
    if (!message) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        message = 'Connecting to backend... Render is waking up (takes ~20-30s on free tier). Please try again in a few moments.';
      } else {
        message = error.message || 'Something went wrong while processing your request. Please try again.';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
