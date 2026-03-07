import { Locale } from '@org/prisma/browser';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const supportedLocales = Object.values(Locale).map((val) =>
  val.toLowerCase()
);
export type SupportedLocale = (typeof supportedLocales)[number];
export const defaultLocale: SupportedLocale = 'tr';

export function getLocalesPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, '..', 'locales');
}
