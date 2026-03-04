export type StoreSettingsResponse = {
  id: string;
  defaultLocale: string;
  storeName: string;
  currency: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
};
