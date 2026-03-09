import { headers } from 'next/headers';

export default async function HomePage() {
  const h = await headers();
  const storeName = decodeURIComponent(h.get('x-store-name') ?? 'Store');

  return (
    <div>
      <h1>Welcome to {storeName}</h1>
      <p>B2C Storefront — Coming soon.</p>
    </div>
  );
}
