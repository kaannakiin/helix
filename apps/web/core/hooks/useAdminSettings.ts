import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type {
  InstallationIngress,
  PlatformInstallation,
  Store,
} from '@org/prisma/browser';
import type {
  DomainSpaceOutput,
  DomainSpaceView,
  PlatformInstallationOutput,
  StoreHostBindingOutput,
  StoreHostBindingView,
  UpdateStoreOutput,
} from '@org/schemas/admin/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export interface PlatformInstallationRecord extends PlatformInstallation {
  ingress: InstallationIngress | null;
}

export type DomainSpaceRecord = DomainSpaceView;
export type StoreHostBindingRecord = StoreHostBindingView;

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
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const usePlatformInstallation = () =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.platformInstallation.detail,
    queryFn: async () => {
      const res = await apiClient.get<PlatformInstallationRecord | null>(
        '/admin/platform-installation'
      );
      return res.data;
    },
  });

export const useSavePlatformInstallation = (options?: {
  onSuccess?: (result: PlatformInstallationRecord) => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlatformInstallationOutput) => {
      const res = await apiClient.put<PlatformInstallationRecord>(
        '/admin/platform-installation',
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.platformInstallation.detail,
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.domainSpaces.list,
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(),
      });
      void fetch('/api/revalidate-locale', { method: 'POST' });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useDomainSpaces = () =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.domainSpaces.list,
    queryFn: async () => {
      const res = await apiClient.get<DomainSpaceRecord[]>(
        '/admin/domain-spaces'
      );
      return res.data;
    },
  });

export const useCreateDomainSpace = (options?: {
  onSuccess?: (result: DomainSpaceRecord) => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DomainSpaceOutput) => {
      const res = await apiClient.post<DomainSpaceRecord>(
        '/admin/domain-spaces',
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.domainSpaces.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

function createDomainSpaceVerificationMutation(
  pathSegment: string,
  options?: {
    onSuccess?: (result: DomainSpaceRecord) => void;
    onError?: (err: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainSpaceId: string) => {
      const res = await apiClient.post<DomainSpaceRecord>(
        `/admin/domain-spaces/${domainSpaceId}/${pathSegment}`
      );
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.domainSpaces.list,
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
}

export const useVerifyDomainSpaceOwnership = (options?: {
  onSuccess?: (result: DomainSpaceRecord) => void;
  onError?: (err: Error) => void;
}) => createDomainSpaceVerificationMutation('verify-ownership', options);

export const useVerifyDomainSpaceApexRouting = (options?: {
  onSuccess?: (result: DomainSpaceRecord) => void;
  onError?: (err: Error) => void;
}) => createDomainSpaceVerificationMutation('verify-apex-routing', options);

export const useVerifyDomainSpaceWildcardRouting = (options?: {
  onSuccess?: (result: DomainSpaceRecord) => void;
  onError?: (err: Error) => void;
}) => createDomainSpaceVerificationMutation('verify-wildcard-routing', options);

export const useStoreHostBindings = (storeId?: string) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(storeId),
    enabled: !!storeId,
    queryFn: async () => {
      const res = await apiClient.get<StoreHostBindingRecord[]>(
        '/admin/store-host-bindings',
        {
          params: { storeId },
        }
      );
      return res.data;
    },
  });

export const useCreateStoreHostBinding = (options?: {
  storeId?: string;
  onSuccess?: (result: StoreHostBindingRecord) => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StoreHostBindingOutput) => {
      const res = await apiClient.post<StoreHostBindingRecord>(
        '/admin/store-host-bindings',
        data
      );
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(
          options?.storeId
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.detail(result.storeId),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useDeleteStoreHostBinding = (options?: {
  storeId?: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bindingId: string) => {
      await apiClient.delete(`/admin/store-host-bindings/${bindingId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(
          options?.storeId
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.domainSpaces.list,
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.();
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useDeleteDomainSpace = (options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainSpaceId: string) => {
      await apiClient.delete(`/admin/domain-spaces/${domainSpaceId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.domainSpaces.list,
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.();
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};

export const useVerifyStoreHostBindingRouting = (options?: {
  storeId?: string;
  onSuccess?: (result: StoreHostBindingRecord) => void;
  onError?: (err: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bindingId: string) => {
      const res = await apiClient.post<StoreHostBindingRecord>(
        `/admin/store-host-bindings/${bindingId}/verify-routing`
      );
      return res.data;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.storeHostBindings.list(
          options?.storeId
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.detail(result.storeId),
      });
      void queryClient.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.stores.list,
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => options?.onError?.(err as Error),
  });
};
