import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

const VALIDATION_PREFIX = 'validation.';

function translateErrors(
  errors: FieldErrors,
  t: (key: string) => string
): FieldErrors {
  // Leaf FieldError — has a string message, translate it
  const asAny = errors as Record<string, unknown>;
  if (typeof asAny.message === 'string') {
    return {
      ...asAny,
      message: asAny.message.startsWith(VALIDATION_PREFIX)
        ? t((asAny.message as string).slice(VALIDATION_PREFIX.length))
        : asAny.message,
    } as unknown as FieldErrors;
  }

  // Array — preserve array type, recurse into each element
  if (Array.isArray(errors)) {
    return errors.map((entry) =>
      entry == null ? entry : translateErrors(entry as FieldErrors, t)
    ) as unknown as FieldErrors;
  }

  // Plain object — iterate keys and recurse
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(errors)) {
    if (entry == null) {
      out[key] = entry;
      continue;
    }
    out[key] = translateErrors(entry as FieldErrors, t);
  }
  return out as FieldErrors;
}

export function useTranslatedZodResolver<T extends FieldValues>(
  schema: z.ZodType<unknown, T>
): Resolver<T> {
  const t = useTranslations('validation');
  const base = zodResolver(schema);

  return (async (values, context, options) => {
    const result = await base(values, context, options);

    if (Object.keys(result.errors).length > 0) {
      return {
        values: result.values,
        errors: translateErrors(result.errors, (key) => t(key)),
      };
    }

    return result;
  }) as Resolver<T>;
}
