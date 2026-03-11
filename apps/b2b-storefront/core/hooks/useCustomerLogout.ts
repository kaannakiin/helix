'use client';

import { useCustomerAuthStore } from '@org/hooks';
import { useCallback } from 'react';
import { apiClient } from '../lib/api/api-client';

export function useCustomerLogout() {
  const logout = useCustomerAuthStore((s) => s.logout);

  return useCallback(() => {
    return logout(async () => {
      await apiClient.post('/storefront/auth/logout');
      // B2B: also clear organization store on logout
      const { useOrganizationStore } = await import(
        '../stores/useOrganizationStore'
      );
      useOrganizationStore.getState().clearOrganization();
    });
  }, [logout]);
}
