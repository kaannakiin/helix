const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

let cachedHostname: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

async function fetchPortalHostname(): Promise<string | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/platform-installation/config`
    );
    if (res.ok) {
      const data = await res.json();
      return (data.portalHostname as string) ?? null;
    }
  } catch {
    // backend unreachable
  }
  return null;
}

export async function getPortalHostname(): Promise<string | null> {
  if (cachedHostname) return cachedHostname;

  if (!fetchPromise) {
    fetchPromise = fetchPortalHostname().then((hostname) => {
      cachedHostname = hostname;
      fetchPromise = null;
      return hostname;
    });
  }
  return fetchPromise;
}

export function invalidatePortalHostnameCache(): void {
  cachedHostname = null;
}
