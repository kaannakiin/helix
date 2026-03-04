import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { Store } from '@org/prisma/browser';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminStores = () =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.stores.list,
    queryFn: async () => {
      const res = await apiClient.get<Store[]>('/admin/stores');
      return res.data;
    },
  });

export const useAdminStore = (id: string | undefined) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.stores.detail(id!),
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get<Store>(`/admin/stores/${id}`);
      return res.data;
    },
  });
