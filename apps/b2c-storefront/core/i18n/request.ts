import type { B2CMessages } from '@org/i18n';
import { defaultLocale, supportedLocales } from '@org/i18n';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(supportedLocales as readonly string[]).includes(locale)) {
    locale = defaultLocale;
  }

  const [validation, b2c] = await Promise.all([
    import(
      `../../../../packages/i18n/src/locales/${locale}/validation.json`
    ),
    import(
      `../../../../packages/i18n/src/locales/${locale}/b2c.json`
    ),
  ]);

  const messages: B2CMessages = {
    validation: validation.default,
    frontend: b2c.default,
  };

  return { locale, messages };
});
