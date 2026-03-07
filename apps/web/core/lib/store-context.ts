import type { StoreContext } from '@org/types/storefront';
import { headers } from 'next/headers';

export async function getStoreContext(): Promise<StoreContext | null> {
  const h = await headers();
  const id = h.get('x-store-id');
  if (!id) return null;
  return {
    id,
    slug: h.get('x-store-slug') ?? '',
    name: decodeURIComponent(h.get('x-store-name') ?? ''),
  };
}

export async function getRealm(): Promise<'admin' | 'storefront'> {
  const h = await headers();
  return (h.get('x-realm') as 'admin' | 'storefront') ?? 'admin';
}
