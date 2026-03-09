export interface CookieStore {
  get(name: string): { value: string } | undefined;
}

export interface ServerFetchDeps {
  cookies: () => Promise<CookieStore>;
  headers: () => Promise<Headers>;
  redirect: (url: string) => never;
}

export interface ServerFetchConfig {
  backendUrl: string;
  accessTokenCookieName: string;
  unauthorizedRedirect: string;
  deps: ServerFetchDeps;
}

export function createServerFetch(config: ServerFetchConfig) {
  return async function serverFetch<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headersList = await config.deps.headers();

    const freshToken = headersList.get('x-fresh-access-token');

    const cookieStore = await config.deps.cookies();
    const accessToken =
      freshToken ?? cookieStore.get(config.accessTokenCookieName)?.value;

    const reqHeaders = new Headers(options.headers);
    if (accessToken) {
      reqHeaders.set(
        'Cookie',
        `${config.accessTokenCookieName}=${accessToken}`
      );
    }

    const response = await fetch(`${config.backendUrl}${path}`, {
      ...options,
      headers: reqHeaders,
    });

    if (response.status === 401) {
      config.deps.redirect(config.unauthorizedRedirect);
    }

    if (!response.ok) {
      throw new Error(`Server fetch failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  };
}
