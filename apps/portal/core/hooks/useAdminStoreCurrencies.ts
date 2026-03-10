import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { StoreCurrency } from '@org/prisma/browser';
import type {
  StoreCurrencyCreateOutput,
  StoreCurrencyUpdateOutput,
} from '@org/schemas/admin/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminStoreCurrencies = (storeId: string | undefined) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.stores.currencies(storeId!),
    enabled: !!storeId,
    queryFn: async () => {
      const res = await apiClient.get<StoreCurrency[]>(
        `/admin/stores/${storeId}/currencies`
      );
      return res.data;
    },
  });

export const useCreateStoreCurrency = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: StoreCurrencyCreateOutput) => {
      const res = await apiClient.post<StoreCurrency>(
        `/admin/stores/${storeId}/currencies`,
        data
      );
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.currencies(storeId),
      }),
  });
};

export const useUpdateStoreCurrency = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: StoreCurrencyUpdateOutput;
    }) => {
      const res = await apiClient.patch<StoreCurrency>(
        `/admin/stores/${storeId}/currencies/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.currencies(storeId),
      }),
  });
};

export const useDeleteStoreCurrency = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/stores/${storeId}/currencies/${id}`);
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.currencies(storeId),
      }),
  });
};
