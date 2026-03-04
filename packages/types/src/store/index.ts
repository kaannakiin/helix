import type { BusinessModel } from '@org/prisma/client';

export interface StoreContext {
  storeId: string;
  businessModel: BusinessModel;
  slug: string;
}
