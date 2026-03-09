import type { PortalMessages } from '@org/i18n';
import { defaultLocale, supportedLocales } from '@org/i18n';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(supportedLocales as readonly string[]).includes(locale)) {
    locale = defaultLocale;
  }

  const [validation, portal] = await Promise.all([
    import(
      `../../../../packages/i18n/src/locales/${locale}/validation.json`
    ),
    import(
      `../../../../packages/i18n/src/locales/${locale}/portal.json`
    ),
  ]);

  const messages: PortalMessages = {
    validation: validation.default,
    frontend: portal.default,
  };

  return { locale, messages };
});
