import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { VariantGroupOutput } from '@org/schemas/admin/variants';
import type { AdminVariantGroupDetailPrismaType } from '@org/types/admin/variants';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminVariantGroup = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.variants.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminVariantGroupDetailPrismaType>(
        `/admin/variant-groups/${id}`
      );
      return res.data;
    },
  });
};

export const useSaveVariantGroup = (options?: {
  onSuccess?: (result: AdminVariantGroupDetailPrismaType) => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (data: VariantGroupOutput) => {
      const res = await apiClient.post<AdminVariantGroupDetailPrismaType>(
        '/admin/variant-groups/save',
        data
      );
      return res.data;
    },
    onSuccess: (result, _vars, _mutateResult, context) => {
      context.client.removeQueries({
        queryKey: DATA_ACCESS_KEYS.admin.variants.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.variants.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
