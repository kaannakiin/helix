import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { AdminCustomerDetailPrismaType } from '@org/types/admin/customers';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useUserDetail = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.customers.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<AdminCustomerDetailPrismaType>(
        `/admin/customers/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
};
