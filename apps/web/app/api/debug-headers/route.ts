import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const h = await headers();
  return NextResponse.json({
    'x-realm': h.get('x-realm'),
    'x-store-id': h.get('x-store-id'),
    'x-store-slug': h.get('x-store-slug'),
    'x-store-name': h.get('x-store-name'),
    'x-lang': h.get('x-lang'),
    host: h.get('host'),
  });
}
