/**
 * Storefront Router — Host Resolution Cache
 *
 * In-memory LRU cache for hostname → upstream mapping.
 * Falls back to backend resolve endpoint on cache miss.
 */

export type BusinessModel = 'B2C' | 'B2B';

export interface ResolvedHost {
  storeId: string;
  storeSlug: string;
  storeName: string;
  businessModel: BusinessModel;
}

interface CacheEntry {
  data: ResolvedHost;
  expiresAt: number;
}

const CACHE_TTL_MS = 300_000;
const MAX_CACHE_SIZE = 10_000;

export class ResolveCache {
  private cache = new Map<string, CacheEntry>();
  private backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
  }

  async resolve(hostname: string): Promise<ResolvedHost | null> {
    const normalized = hostname.trim().toLowerCase().replace(/\.+$/, '');

    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const res = await fetch(
        `${
          this.backendUrl
        }/api/storefront/domains/resolve?hostname=${encodeURIComponent(
          normalized
        )}`
      );

      if (!res.ok) {
        this.cache.delete(normalized);
        return null;
      }

      const data = (await res.json()) as {
        store?: {
          id: string;
          slug: string;
          name: string;
          businessModel: BusinessModel;
        };
        storeId?: string;
        storeSlug?: string;
        storeName?: string;
      };
      const resolved: ResolvedHost = {
        storeId: data.store?.id ?? data.storeId ?? '',
        storeSlug: data.store?.slug ?? data.storeSlug ?? '',
        storeName: data.store?.name ?? data.storeName ?? '',
        businessModel: data.store?.businessModel ?? 'B2C',
      };

      if (this.cache.size >= MAX_CACHE_SIZE) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }

      this.cache.set(normalized, {
        data: resolved,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return resolved;
    } catch {
      if (cached) return cached.data;
      return null;
    }
  }

  invalidate(hostname: string): void {
    const normalized = hostname.trim().toLowerCase().replace(/\.+$/, '');
    this.cache.delete(normalized);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
