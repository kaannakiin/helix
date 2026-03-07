import { invalidateLocaleCache } from '@/core/lib/locale-cache';
import { NextResponse } from 'next/server';

export async function POST() {
  invalidateLocaleCache();
  return NextResponse.json({ ok: true });
}
