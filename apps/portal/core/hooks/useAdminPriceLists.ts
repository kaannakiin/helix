import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { PriceListOutput } from '@org/schemas/admin/pricing';
import type { AdminPriceListDetailPrismaType } from '@org/types/admin/pricing';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminPriceList = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.priceLists.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminPriceListDetailPrismaType>(
        `/admin/price-lists/${id}`
      );
      return res.data;
    },
  });
};

export const useSavePriceList = (options?: {
  onSuccess?: (result: AdminPriceListDetailPrismaType) => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (data: PriceListOutput) => {
      const res = await apiClient.post<AdminPriceListDetailPrismaType>(
        '/admin/price-lists/save',
        data
      );
      return res.data;
    },
    onSuccess: (result, __var, __res, context) => {
      context.client.removeQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
