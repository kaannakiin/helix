import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { CategoryOutput } from '@org/schemas/admin/categories';
import type { AdminCategoryDetailPrismaType } from '@org/types/admin/categories';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminCategory = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.categories.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminCategoryDetailPrismaType>(
        `/admin/categories/${id}`
      );
      return res.data;
    },
  });
};

export const useSaveCategory = (options?: {
  onSuccess?: (result: AdminCategoryDetailPrismaType) => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (data: CategoryOutput) => {
      const res = await apiClient.post<AdminCategoryDetailPrismaType>(
        '/admin/categories/save',
        data
      );
      return res.data;
    },
    onSuccess: (result, _vars, _mutateResult, context) => {
      context.client.removeQueries({
        queryKey: DATA_ACCESS_KEYS.admin.categories.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.categories.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
