import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';

const VALIDATION_PREFIX = 'validation.';
type SchemaLike = { _input: FieldValues; _output: FieldValues };

function translateErrors(
  errors: FieldErrors,
  t: (key: string) => string
): FieldErrors {
  const asAny = errors as Record<string, unknown>;
  if (typeof asAny.message === 'string') {
    return {
      ...asAny,
      message: asAny.message.startsWith(VALIDATION_PREFIX)
        ? t((asAny.message as string).slice(VALIDATION_PREFIX.length))
        : asAny.message,
    } as unknown as FieldErrors;
  }

  if (Array.isArray(errors)) {
    return errors.map((entry) =>
      entry == null ? entry : translateErrors(entry as FieldErrors, t)
    ) as unknown as FieldErrors;
  }

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

export function useTranslatedZodResolver<TSchema extends SchemaLike>(
  schema: TSchema
): Resolver<TSchema['_input'], unknown, TSchema['_output']> {
  const t = useTranslations('validation');
  const base = zodResolver(
    schema as unknown as Parameters<typeof zodResolver>[0]
  ) as Resolver<TSchema['_input'], unknown, TSchema['_output']>;

  return (async (values, context, options) => {
    const result = await base(values, context, options);

    if (Object.keys(result.errors).length > 0) {
      return {
        values: result.values,
        errors: translateErrors(result.errors, (key) => t(key)),
      };
    }

    return result;
  }) as Resolver<TSchema['_input'], unknown, TSchema['_output']>;
}
