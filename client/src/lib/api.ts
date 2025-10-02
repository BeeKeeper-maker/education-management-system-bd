import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// API helper functions
export const apiClient = {
  get: <T = any>(url: string, params?: any) =>
    api.get<ApiResponse<T>>(url, { params }).then((res) => res.data),

  post: <T = any>(url: string, data?: any) =>
    api.post<ApiResponse<T>>(url, data).then((res) => res.data),

  put: <T = any>(url: string, data?: any) =>
    api.put<ApiResponse<T>>(url, data).then((res) => res.data),

  patch: <T = any>(url: string, data?: any) =>
    api.patch<ApiResponse<T>>(url, data).then((res) => res.data),

  delete: <T = any>(url: string) =>
    api.delete<ApiResponse<T>>(url).then((res) => res.data),
};