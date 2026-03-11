import type { CustomerTokenPayload } from '@org/types/storefront';
import { headers } from 'next/headers';
import { CustomerAuthProvider } from '@org/hooks/providers/CustomerAuthProvider';
import { QueryProvider } from '@/core/providers/query-provider';

function getCustomerFromHeaders(h: Headers): CustomerTokenPayload | null {
  const sub = h.get('x-customer-sub');
  if (!sub) return null;
  return {
    sub,
    sessionId: h.get('x-customer-sessionId') ?? '',
    storeId: h.get('x-customer-storeId') ?? '',
    name: decodeURIComponent(h.get('x-customer-name') ?? ''),
    surname: decodeURIComponent(h.get('x-customer-surname') ?? ''),
    email: h.get('x-customer-email')
      ? decodeURIComponent(h.get('x-customer-email')!)
      : null,
    phone: h.get('x-customer-phone')
      ? decodeURIComponent(h.get('x-customer-phone')!)
      : null,
    aud: 'storefront',
  };
}

export async function generateMetadata() {
  const h = await headers();
  const storeName = decodeURIComponent(
    h.get('x-store-name') ?? process.env.DEV_STORE_NAME ?? 'Store'
  );
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
  const storeName = decodeURIComponent(
    h.get('x-store-name') ?? process.env.DEV_STORE_NAME ?? 'Store'
  );
  const businessModel = h.get('x-business-model') ?? 'B2C';
  const customer = getCustomerFromHeaders(h);

  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <CustomerAuthProvider customer={customer}>
            <header
              style={{ padding: '1rem', borderBottom: '1px solid #eee' }}
            >
              <strong>{storeName}</strong>
              <span
                style={{
                  marginLeft: '1rem',
                  fontSize: '0.75rem',
                  color: '#999',
                }}
              >
                {businessModel} Storefront
              </span>
            </header>
            <main style={{ padding: '1rem' }}>{children}</main>
          </CustomerAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
