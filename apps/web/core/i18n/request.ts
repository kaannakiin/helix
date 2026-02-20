import type { Messages } from '@org/i18n';
import { defaultLocale, supportedLocales } from '@org/i18n';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(supportedLocales as readonly string[]).includes(locale)) {
    locale = defaultLocale;
  }

  const messages: Messages = {
    validation: (
      await import(
        `../../../../packages/i18n/src/locales/${locale}/validation.json`
      )
    ).default,
    common: (
      await import(
        `../../../../packages/i18n/src/locales/${locale}/common.json`
      )
    ).default,
  };

  return { locale, messages };
});
