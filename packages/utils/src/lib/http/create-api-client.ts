import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiClientConfig {
  baseURL: string;
  refreshEndpoint: string;
  onRefreshFailure?: () => void;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fieldErrors: FieldError[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isValidation() {
    return this.statusCode === 422;
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }

  get isConflict() {
    return this.statusCode === 409;
  }

  get isForbidden() {
    return this.statusCode === 403;
  }

  get isNotFound() {
    return this.statusCode === 404;
  }

  get isNetworkError() {
    return this.statusCode === 0;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

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

  // Interceptor 1: 401 → refresh token → retry with queue
  client.interceptors.response.use(
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
        }).then(() => client(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(config.refreshEndpoint, null, {
          withCredentials: true,
        });

        processQueue(null);

        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        config.onRefreshFailure?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  // Interceptor 2: Error normalization → ApiError
  client.interceptors.response.use(
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

  return client;
}
