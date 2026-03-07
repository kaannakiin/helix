import {
  defaultLocale,
  supportedLocales,
  type SupportedLocale,
} from '@org/i18n';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

let cachedLocale: SupportedLocale | null = null;
let fetchPromise: Promise<SupportedLocale> | null = null;

async function fetchDefaultLocale(): Promise<SupportedLocale> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/platform-installation/config`
    );
    if (res.ok) {
      const data = await res.json();
      const locale = data.defaultLocale?.toLowerCase();
      if ((supportedLocales as readonly string[]).includes(locale)) {
        return locale as SupportedLocale;
      }
    }
  } catch {
    // backend unreachable — use static fallback
  }
  return defaultLocale;
}

export async function getDefaultLocale(): Promise<SupportedLocale> {
  if (cachedLocale) return cachedLocale;

  if (!fetchPromise) {
    fetchPromise = fetchDefaultLocale().then((locale) => {
      cachedLocale = locale;
      fetchPromise = null;
      return locale;
    });
  }
  return fetchPromise;
}

export function invalidateLocaleCache(): void {
  cachedLocale = null;
}
