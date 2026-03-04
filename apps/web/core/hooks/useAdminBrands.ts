import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { BrandOutput } from '@org/schemas/admin/brands';
import type { AdminBrandDetailPrismaType } from '@org/types/admin/brands';
import { useMutation, useQuery } from '@tanstack/react-query';
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

export const useSaveBrand = (options?: {
  onSuccess?: (result: AdminBrandDetailPrismaType) => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (data: BrandOutput) => {
      const res = await apiClient.post<AdminBrandDetailPrismaType>(
        '/admin/brands/save',
        data
      );
      return res.data;
    },
    onSuccess: (result, __var, __res, context) => {
      context.client.removeQueries({
        queryKey: DATA_ACCESS_KEYS.admin.brands.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.brands.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
