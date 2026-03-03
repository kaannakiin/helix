import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import { VariantGroupType } from '@org/prisma/browser';
import type { LookupItem } from '@org/schemas/admin/common';
import type { AdminProductDetailPrismaType } from '@org/types/admin/products';
import type { AdminVariantGroupDetailPrismaType } from '@org/types/admin/variants';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export interface VariantGroupLookupItem extends LookupItem {
  extra?: {
    type: VariantGroupType;
    optionLabels: string[];
  };
}

export const useAdminProducts = () => {};

export const useAdminProduct = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.products.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminProductDetailPrismaType>(
        `/admin/products/${id}`
      );
      return res.data;
    },
  });
};

export const useVariantGroupSearch = (
  q: string,
  enabled = true,
  exclude?: string[]
) => {
  return useQuery({
    queryKey: [...DATA_ACCESS_KEYS.admin.variants.lookup(q), exclude],
    enabled,
    queryFn: async () => {
      const res = await apiClient.get<VariantGroupLookupItem[]>(
        '/admin/variant-groups/lookup',
        {
          params: {
            q: q || undefined,
            limit: 100,
            ...(exclude?.length ? { exclude: exclude.join(',') } : {}),
          },
        }
      );
      return res.data;
    },
  });
};

interface CheckSlugResult {
  exists: boolean;
  matchedGroupId?: string;
  matchedLocale?: string;
}

export const useCheckVariantGroupSlug = () => {
  return useMutation({
    mutationFn: async (params: { name: string; excludeIds?: string[] }) => {
      const res = await apiClient.get<CheckSlugResult>(
        '/admin/variant-groups/check-slug',
        {
          params: {
            name: params.name,
            ...(params.excludeIds?.length
              ? { excludeIds: params.excludeIds.join(',') }
              : {}),
          },
        }
      );
      return res.data;
    },
  });
};

export const useVariantGroupDetail = (id: string | null) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.variants.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get<AdminVariantGroupDetailPrismaType>(
        `/admin/variant-groups/${id}`
      );
      return res.data;
    },
  });
};
