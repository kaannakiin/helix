import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { LookupItem } from '@org/schemas/admin/common';
import type { PaginatedResponse } from '@org/types/pagination';
import type {
  TreeFetchOptions,
  TreeNode,
} from '@org/ui/inputs/relation-drawer';
import type { FetchOptions } from '@org/ui/inputs/relation-input';
import { apiClient } from '../lib/api/api-client';

const LOOKUP_LIMIT = 100;

function createLookupFetcher(endpoint: string): FetchOptions {
  return async (params) => {
    const res = await apiClient.get<
      LookupItem[] | PaginatedResponse<LookupItem>
    >(endpoint, {
      params: {
        ...(params.q ? { q: params.q } : {}),
        ...(params.ids?.length ? { ids: params.ids.join(',') } : {}),
        ...(params.page ? { page: params.page } : {}),
        limit: LOOKUP_LIMIT,
      },
    });

    return res.data;
  };
}

function createTreeFetcher(
  endpoint: string,
  parentIdKey = 'parentId'
): TreeFetchOptions {
  return async (params) => {
    const res = await apiClient.get<TreeNode[] | PaginatedResponse<TreeNode>>(
      endpoint,
      {
        params: {
          ...(params.q ? { q: params.q } : {}),
          ...(params.ids?.length ? { ids: params.ids.join(',') } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.parentId ? { [parentIdKey]: params.parentId } : {}),
          limit: LOOKUP_LIMIT,
        },
      }
    );

    return res.data;
  };
}

export const brandLookupFetcher = createLookupFetcher('/admin/brands/lookup');
export const categoryLookupFetcher = createLookupFetcher(
  '/admin/categories/lookup'
);
export const categoryTreeFetcher = createTreeFetcher('/admin/categories/tree');
export const tagLookupFetcher = createLookupFetcher(
  '/admin/tag-groups/tags/lookup'
);
export const tagTreeFetcher = createTreeFetcher(
  '/admin/tag-groups/tags/tree',
  'tagGroupId'
);
export const variantGroupLookupFetcher = createLookupFetcher(
  '/admin/variant-groups/lookup'
);

export const taxonomyLookupFetcher = createLookupFetcher(
  '/admin/taxonomy/lookup'
);
export const taxonomyTreeFetcher = createTreeFetcher('/admin/taxonomy/tree');

export { DATA_ACCESS_KEYS };
