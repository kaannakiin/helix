import { createApiClient } from '@org/utils/http/create-api-client';

import { API_BASE_URL } from './api-base-url';

const apiClient = createApiClient({
  baseURL: API_BASE_URL,
  refreshEndpoint: `${API_BASE_URL}/admin/auth/refresh`,
  onRefreshFailure: () => {
    import('@/core/stores/auth.store').then(({ useAuthStore }) => {
      useAuthStore.getState().clearUser();
      window.location.href = '/auth';
    });
  },
});

export { apiClient };
