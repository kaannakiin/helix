import { headers } from 'next/headers';

export async function generateMetadata() {
  const h = await headers();
  const storeName = decodeURIComponent(h.get('x-store-name') ?? process.env.DEV_STORE_NAME ?? 'Store');
  return {
    title: storeName,
    description: `Welcome to ${storeName}`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const storeId = h.get('x-store-id') ?? process.env.DEV_STORE_ID ?? '';
  const storeSlug = h.get('x-store-slug') ?? process.env.DEV_STORE_SLUG ?? '';
  const storeName = decodeURIComponent(h.get('x-store-name') ?? process.env.DEV_STORE_NAME ?? 'Store');
  const businessModel = h.get('x-business-model') ?? 'B2C';

  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <strong>{storeName}</strong>
          <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: '#999' }}>
            {businessModel} Storefront
          </span>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
        {/* Store context available via headers for server components */}
        {/* storeId={storeId} storeSlug={storeSlug} */}
      </body>
    </html>
  );
}
