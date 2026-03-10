import type { BuyerType } from '@org/prisma/browser';

export interface BuyerRef {
  buyerType: BuyerType;
  buyerCustomerId?: string | null;
  buyerOrganizationId?: string | null;
  placedByCustomerId: string;
}
