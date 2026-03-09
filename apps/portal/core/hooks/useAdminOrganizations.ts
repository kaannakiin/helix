import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { AdminOrganizationDetailPrismaType } from '@org/types/admin/organizations';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useOrganizationDetail = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.organizations.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<AdminOrganizationDetailPrismaType>(
        `/admin/organizations/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
};
