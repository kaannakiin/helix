import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { CustomerGroupOutput } from '@org/schemas/admin/customer-groups';
import type { AdminCustomerGroupDetailPrismaType } from '@org/types/admin/customer-groups';
import type { AdminCustomersPrismaType } from '@org/types/admin/customers';
import type { PaginatedResponse } from '@org/types/pagination';
import type { MemberFetchOptions } from '@org/ui/inputs/member-selector';
import type { DrawerFetchOptions } from '@org/ui/inputs/relation-drawer';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '../lib/api/api-client';


export const useCustomersFetchOptions = (): MemberFetchOptions => {
  return useCallback(async ({ q, page = 1 }: { q?: string; page?: number }) => {
    const query: Record<string, unknown> = { page, limit: 100 };

    if (q?.trim()) {
      query.filters = {
        name: { filterType: 'text', op: 'contains', value: q.trim() },
      };
    }

    const res = await apiClient.post<
      PaginatedResponse<AdminCustomersPrismaType>
    >('/admin/customers/query', query);

    return {
      data: res.data.data.map((c) => ({
        id: c.id,
        label: `${c.name} ${c.surname}`,
        email: c.email ?? undefined,
      })),
      pagination: res.data.pagination,
    };
  }, []);
};

export const useCustomersDrawerFetchOptions = (): DrawerFetchOptions => {
  return useCallback(async ({ q, ids, page = 1 }) => {
    const query: Record<string, unknown> = { page, limit: 100 };

    if (q?.trim()) {
      query.filters = {
        name: { filterType: 'text', op: 'contains', value: q.trim() },
      };
    }

    if (ids?.length) {
      query.filters = {
        ...((query.filters as Record<string, unknown>) ?? {}),
        id: { filterType: 'set', op: 'in', values: ids },
      };
    }

    const res = await apiClient.post<
      PaginatedResponse<AdminCustomersPrismaType>
    >('/admin/customers/query', query);

    return {
      data: res.data.data.map((c) => ({
        id: c.id,
        label: `${c.name} ${c.surname}`,
        extra: { email: c.email ?? undefined },
      })),
      pagination: res.data.pagination,
    };
  }, []);
};

export const useAdminCustomerGroup = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.customerGroups.detail(id),
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AdminCustomerGroupDetailPrismaType>(
        `/admin/customer-groups/${id}`
      );
      return res.data;
    },
  });
};

export const useSaveCustomerGroup = () => {
  return useMutation({
    mutationFn: async (data: CustomerGroupOutput) => {
      const res = await apiClient.post<AdminCustomerGroupDetailPrismaType>(
        '/admin/customer-groups/save',
        data
      );
      return res.data;
    },
    onSuccess: (result, _vars, _mutateResult, context) => {
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.customerGroups.detail(result.id),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.customerGroups.list,
      });
    },
  });
};
