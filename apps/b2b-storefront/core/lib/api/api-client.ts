import { createApiClient } from '@org/utils/http/create-api-client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

const apiClient = createApiClient({
  baseURL: API_BASE_URL,
  refreshEndpoint: `${API_BASE_URL}/storefront/auth/refresh`,
  onRefreshFailure: () => {
    import('@org/hooks').then(({ useCustomerAuthStore }) => {
      useCustomerAuthStore.getState().clearCustomer();
      window.location.href = '/auth/login';
    });
  },
});

export { apiClient };
