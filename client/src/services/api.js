import axios from 'axios';

// Direct backend endpoint to avoid Vite dev server http-proxy EPERM resolution issues
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5050/api';

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
    const message =
      error.response?.data?.error ||
      'Something went wrong while processing your request. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
