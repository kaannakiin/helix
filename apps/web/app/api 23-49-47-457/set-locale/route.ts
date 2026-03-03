import { NextResponse } from 'next/server';
import { supportedLocales } from '@org/i18n';

export async function POST(req: Request) {
  const { locale } = (await req.json()) as { locale: string };

  if (!(supportedLocales as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('LOCALE', locale, { path: '/', sameSite: 'lax' });
  return res;
}
