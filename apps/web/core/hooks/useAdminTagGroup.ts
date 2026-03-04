import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { BaseTagOutput, TagGroupOutput } from '@org/schemas/admin/tags';
import type {
  AdminTagChildrenPrismaType,
  AdminTagGroupDetailPrismaType,
} from '@org/types/admin/tags';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminTagGroup = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.tags.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminTagGroupDetailPrismaType>(
        `/admin/tag-groups/${id}`
      );
      return res.data;
    },
  });
};

export const useTagChildren = (
  tagGroupId: string,
  parentTagId: string | null,
) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.tags.children(tagGroupId, parentTagId),
    enabled: !!tagGroupId && tagGroupId !== 'new',
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (parentTagId) params.parentTagId = parentTagId;
      const res = await apiClient.get<AdminTagChildrenPrismaType[]>(
        `/admin/tag-groups/${tagGroupId}/tags`,
        { params },
      );
      return res.data;
    },
  });
};

export const useSaveTagGroup = (options?: {
  onSuccess?: (result: AdminTagGroupDetailPrismaType) => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (data: TagGroupOutput) => {
      const res = await apiClient.post<AdminTagGroupDetailPrismaType>(
        '/admin/tag-groups/save',
        data
      );
      return res.data;
    },
    onSuccess: (result, _vars, _mutateResult, context) => {
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.tags.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.tags.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useSaveTag = (tagGroupId: string, options?: {
  onSuccess?: (result: AdminTagChildrenPrismaType) => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (data: BaseTagOutput) => {
      const res = await apiClient.post<AdminTagChildrenPrismaType>(
        `/admin/tag-groups/${tagGroupId}/tags/save`,
        data,
      );
      return res.data;
    },
    onSuccess: (result, variables, _mutateResult, context) => {
      const parentId = variables.parentTagId ?? null;
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.tags.children(tagGroupId, parentId),
      });
      // Also invalidate parent's children count (parent's sibling list)
      if (parentId) {
        // Find the parent's parent to invalidate the list containing the parent
        context.client.invalidateQueries({
          queryKey: DATA_ACCESS_KEYS.admin.tags.children(tagGroupId, parentId),
          exact: false,
        });
      }
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useDeleteTag = (tagGroupId: string, options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async ({ tagId, parentTagId }: { tagId: string; parentTagId: string | null }) => {
      await apiClient.delete(`/admin/tag-groups/${tagGroupId}/tags/${tagId}`);
      return { tagId, parentTagId };
    },
    onSuccess: (_result, { parentTagId }, _mutateResult, context) => {
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.tags.children(tagGroupId, parentTagId),
      });
      options?.onSuccess?.();
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useBulkDeleteTags = (tagGroupId: string, options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) => {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiClient.post<{ count: number }>(
        `/admin/tag-groups/${tagGroupId}/tags/bulk-delete`,
        { ids },
      );
      return res.data;
    },
    onSuccess: (_result, _vars, _mutateResult, context) => {
      // Invalidate all children queries for this tag group
      context.client.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === 'admin' &&
            key[1] === 'tags' &&
            key[2] === 'children' &&
            key[3] === tagGroupId
          );
        },
      });
      options?.onSuccess?.();
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
