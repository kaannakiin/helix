import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { UpdateStoreOutput } from '@org/schemas/admin/settings';
import type { Store } from '@org/prisma/browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useStoreSettings = (storeId: string | undefined) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.stores.detail(storeId!),
    enabled: !!storeId,
    queryFn: async () => {
      const res = await apiClient.get<Store>(`/admin/stores/${storeId}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveStoreSettings = (options?: {
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
        queryKey: DATA_ACCESS_KEYS.admin.stores.detail(options?.storeId!),
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
