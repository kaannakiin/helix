import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type {
  PriceListPriceBulkCreateOutput,
  PriceListPriceSaveOutput,
} from '@org/schemas/admin/pricing';
import type { AdminPriceListPriceListPrismaType } from '@org/types/admin/pricing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

interface PricesSummary {
  totalRows: number;
  lockedRows: number;
  missingPrices: number;
  currencies: string[];
}

export const useAdminPriceListPricesSummary = (
  priceListId: string | undefined
) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.priceLists.pricesSummary(priceListId!),
    enabled: !!priceListId && priceListId !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<PricesSummary>(
        `/admin/price-lists/${priceListId}/prices/summary`
      );
      return res.data;
    },
  });

export const useSavePriceListPrice = (priceListId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PriceListPriceSaveOutput) => {
      const res = await apiClient.post<AdminPriceListPriceListPrismaType>(
        `/admin/price-lists/${priceListId}/prices/save`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.prices(priceListId),
      });
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.pricesSummary(priceListId),
      });
    },
  });
};

export const useDeletePriceListPrice = (priceListId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(
        `/admin/price-lists/${priceListId}/prices/${id}`
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.prices(priceListId),
      });
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.pricesSummary(priceListId),
      });
    },
  });
};

export const useBulkCreatePriceListPrices = (priceListId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PriceListPriceBulkCreateOutput) => {
      const res = await apiClient.post<{ created: number }>(
        `/admin/price-lists/${priceListId}/prices/bulk-create`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.prices(priceListId),
      });
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.pricesSummary(priceListId),
      });
    },
  });
};
