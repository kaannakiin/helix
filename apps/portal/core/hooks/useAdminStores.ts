import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { Store } from '@org/prisma/browser';
import type {
  CreateStoreOutput,
  UpdateStoreOutput,
} from '@org/schemas/admin/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useAdminStores = () =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.stores.list,
    queryFn: async () => {
      const res = await apiClient.get<Store[]>('/admin/stores');
      return res.data;
    },
  });

export const useAdminStore = (id: string | undefined) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.stores.detail(id!),
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get<Store>(`/admin/stores/${id}`);
      return res.data;
    },
  });

export const useCreateStore = (options?: {
  onSuccess?: (result: Store) => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStoreOutput) => {
      const res = await apiClient.post<Store>('/admin/stores', data);
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useUpdateStore = (options?: {
  storeId: string | undefined;
  onSuccess?: (result: Store) => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateStoreOutput) => {
      const res = await apiClient.patch<Store>(
        `/admin/stores/${options?.storeId}`,
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.detail(result.id),
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useDeleteStore = (options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storeId: string) => {
      await apiClient.delete(`/admin/stores/${storeId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.();
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
