import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { BrandOutput } from '@org/schemas/admin/brands';
import type { AdminBrandDetailPrismaType } from '@org/types/admin/brands';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminBrand = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.brands.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminBrandDetailPrismaType>(
        `/admin/brands/${id}`
      );
      return res.data;
    },
  });
};

export const useSaveBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BrandOutput) => {
      const res = await apiClient.post<AdminBrandDetailPrismaType>(
        '/admin/brands/save',
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.brands.detail(result.id),
      });
      queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.brands.list,
      });
    },
  });
};
