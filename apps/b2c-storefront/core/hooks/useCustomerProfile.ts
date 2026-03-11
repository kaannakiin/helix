'use client';

import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import { useCustomerAuthStore } from '@org/hooks';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export function useCustomerProfile() {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: DATA_ACCESS_KEYS.storefront.customer.profile,
    enabled: isAuthenticated,
    queryFn: () =>
      apiClient.get('/storefront/auth/me').then((r) => r.data),
  });
}
