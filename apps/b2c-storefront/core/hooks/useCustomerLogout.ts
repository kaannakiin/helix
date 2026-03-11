'use client';

import { useCustomerAuthStore } from '@org/hooks';
import { useCallback } from 'react';
import { apiClient } from '../lib/api/api-client';

export function useCustomerLogout() {
  const logout = useCustomerAuthStore((s) => s.logout);

  return useCallback(() => {
    return logout(() => apiClient.post('/storefront/auth/logout'));
  }, [logout]);
}
