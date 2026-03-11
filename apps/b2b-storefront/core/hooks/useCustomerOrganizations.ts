'use client';

import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import { useCustomerAuthStore } from '@org/hooks';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export function useCustomerOrganizations() {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: DATA_ACCESS_KEYS.storefront.customer.organizations,
    enabled: isAuthenticated,
    queryFn: () =>
      apiClient
        .get('/storefront/customer/organizations')
        .then((r) => r.data),
  });
}
