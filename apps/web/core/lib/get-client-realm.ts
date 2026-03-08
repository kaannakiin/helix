export function getClientRealm(): 'admin' | 'storefront' {
  if (typeof document === 'undefined') return 'admin';
  const meta = document.querySelector('meta[name="x-realm"]');
  return (meta?.getAttribute('content') as 'admin' | 'storefront') ?? 'admin';
}
