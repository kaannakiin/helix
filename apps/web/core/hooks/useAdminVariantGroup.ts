import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { VariantGroupOutput } from '@org/schemas/admin/variants';
import type { AdminVariantGroupDetailPrismaType } from '@org/types/admin/variants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useSaveVariantGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VariantGroupOutput) => {
      const res = await apiClient.post<AdminVariantGroupDetailPrismaType>(
        '/admin/variant-groups/save',
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.variants.detail(result.id),
      });
      queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.variants.list,
      });
    },
  });
};
