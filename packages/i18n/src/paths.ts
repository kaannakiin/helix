import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const supportedLocales = ['en', 'tr'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const defaultLocale: SupportedLocale = 'tr';

export function getLocalesPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, '..', 'locales');
}
