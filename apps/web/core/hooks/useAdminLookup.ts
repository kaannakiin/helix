import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { LookupItem } from '@org/schemas/admin/common';
import type { FetchOptions } from '@org/ui/inputs/relation-input';
import { apiClient } from '../lib/api/api-client';

const LOOKUP_LIMIT = 20;

function createLookupFetcher(endpoint: string): FetchOptions {
  return async (params) => {
    const res = await apiClient.get<LookupItem[]>(endpoint, {
      params: {
        ...(params.q ? { q: params.q } : {}),
        ...(params.ids?.length ? { ids: params.ids.join(',') } : {}),
        ...(params.page ? { page: params.page } : {}),
        limit: LOOKUP_LIMIT,
      },
    });

    if (params.ids?.length) {
      return res.data;
    }

    return {
      items: res.data,
      hasMore: res.data.length >= LOOKUP_LIMIT,
    };
  };
}

export const brandLookupFetcher = createLookupFetcher('/admin/brands/lookup');
export const categoryLookupFetcher = createLookupFetcher(
  '/admin/categories/lookup'
);
export const tagLookupFetcher = createLookupFetcher(
  '/admin/tag-groups/tags/lookup'
);
export const variantGroupLookupFetcher = createLookupFetcher(
  '/admin/variant-groups/lookup'
);

export { DATA_ACCESS_KEYS };
