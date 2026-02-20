import { join } from 'node:path';

/**
 * Returns the absolute path to the i18n locale directory at runtime.
 *
 * NxAppWebpackPlugin copies locale JSON files into dist/assets/i18n.
 * __dirname in the Webpack bundle resolves to the dist directory.
 */
export function getBackendLocalesPath(): string {
  return join(__dirname, 'assets', 'i18n');
}
