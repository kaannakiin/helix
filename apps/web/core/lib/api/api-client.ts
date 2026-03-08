import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './api-base-url';
import { ApiError } from './api-error';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown): void {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(undefined);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
        withCredentials: true,
      });

      processQueue(null);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      if (typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/core/stores/auth.store');
        useAuthStore.getState().clearUser();
        const { getClientRealm } = await import(
          '@/core/lib/get-client-realm'
        );
        window.location.href =
          getClientRealm() === 'storefront' ? '/login' : '/auth?tab=login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error instanceof ApiError) {
      return Promise.reject(error);
    }

    if (!error.response) {
      return Promise.reject(new ApiError('Network error', 0));
    }

    const { status, data } = error.response as {
      status: number;
      data: Record<string, unknown>;
    };
    const message =
      typeof data?.message === 'string' ? data.message : 'Unknown error';
    const fieldErrors = Array.isArray(data?.errors) ? data.errors : [];

    return Promise.reject(new ApiError(message, status, fieldErrors));
  }
);

export { apiClient };
