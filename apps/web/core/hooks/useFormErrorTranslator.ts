import { useTranslations } from 'next-intl';

const VALIDATION_PREFIX = 'validation.';

/**
 * Translates V key error messages from Zod schemas into localized strings.
 *
 * Zod schemas use V keys (e.g. `'validation.errors.common.name_required'`).
 * This hook strips the `validation.` prefix and looks up the rest
 * in the `validation` i18n namespace → `validation.json`.
 *
 * Usage:
 * ```tsx
 * const te = useFormErrorTranslator();
 * <TextInput error={te(fieldState.error?.message)} />
 * ```
 */
export function useFormErrorTranslator() {
  const t = useTranslations('validation');

  return (message?: string): string | undefined => {
    if (!message) return undefined;
    if (message.startsWith(VALIDATION_PREFIX)) {
      return t(message.slice(VALIDATION_PREFIX.length));
    }
    return message;
  };
}
