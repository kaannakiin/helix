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
export const tagTreeFetcher: TreeFetchOptions = async (params) => {
  const { parentId, parentExtra, ...rest } = params;

  let tagGroupId: string | undefined;
  let parentTagId: string | undefined;

  if (parentId) {
    const extraTagGroupId = parentExtra?.tagGroupId as string | undefined;
    if (extraTagGroupId) {
      // parent bir Tag — tagGroupId extra'dan gelir, parentTagId = parentId
      tagGroupId = extraTagGroupId;
      parentTagId = parentId;
    } else {
      // parent bir TagGroup — tagGroupId = parentId
      tagGroupId = parentId;
    }
  }

  const res = await apiClient.get<TreeNode[] | PaginatedResponse<TreeNode>>(
    '/admin/tag-groups/tags/tree',
    {
      params: {
        ...(rest.q ? { q: rest.q } : {}),
        ...(rest.ids?.length ? { ids: rest.ids.join(',') } : {}),
        ...(rest.page ? { page: rest.page } : {}),
        ...(tagGroupId ? { tagGroupId } : {}),
        ...(parentTagId ? { parentTagId } : {}),
        limit: LOOKUP_LIMIT,
      },
    }
  );

  return res.data;
};
export const variantGroupLookupFetcher = createLookupFetcher(
  '/admin/variant-groups/lookup'
);

export const taxonomyLookupFetcher = createLookupFetcher(
  '/admin/taxonomy/lookup'
);
export const taxonomyTreeFetcher = createTreeFetcher('/admin/taxonomy/tree');

export { DATA_ACCESS_KEYS };
