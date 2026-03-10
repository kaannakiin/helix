import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { PriceListAssignment } from '@org/prisma/browser';
import type {
  PriceListAssignmentCreateOutput,
  PriceListAssignmentUpdateOutput,
} from '@org/schemas/admin/pricing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

type AssignmentWithRelations = PriceListAssignment & {
  customerGroup: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
  customer: { id: string; name: string; surname: string; email: string | null } | null;
};

export const useAdminPriceListAssignments = (
  priceListId: string | undefined
) =>
  useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.priceLists.assignments(priceListId!),
    enabled: !!priceListId && priceListId !== 'new',
    queryFn: async () => {
      const res = await apiClient.get<AssignmentWithRelations[]>(
        `/admin/price-lists/${priceListId}/assignments`
      );
      return res.data;
    },
  });

export const useCreatePriceListAssignment = (priceListId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PriceListAssignmentCreateOutput) => {
      const res = await apiClient.post<AssignmentWithRelations>(
        `/admin/price-lists/${priceListId}/assignments`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.assignments(priceListId),
      });
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.detail(priceListId),
      });
    },
  });
};

export const useUpdatePriceListAssignment = (priceListId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PriceListAssignmentUpdateOutput;
    }) => {
      const res = await apiClient.patch<AssignmentWithRelations>(
        `/admin/price-lists/${priceListId}/assignments/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.assignments(priceListId),
      });
    },
  });
};

export const useDeletePriceListAssignment = (priceListId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(
        `/admin/price-lists/${priceListId}/assignments/${id}`
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.assignments(priceListId),
      });
      qc.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.priceLists.detail(priceListId),
      });
    },
  });
};
