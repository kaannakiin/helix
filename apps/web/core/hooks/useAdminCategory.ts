import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { CategoryOutput } from '@org/schemas/admin/categories';
import type { AdminCategoryDetailPrismaType } from '@org/types/admin/categories';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useSaveCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryOutput) => {
      const res = await apiClient.post<AdminCategoryDetailPrismaType>(
        '/admin/categories/save',
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.categories.detail(result.id),
      });
      queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.categories.list,
      });
    },
  });
};
