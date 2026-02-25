import * as slugifyModule from 'slugify';

const slugifyLib =
  (
    slugifyModule as unknown as {
      default?: (input: string, options?: object) => string;
    }
  ).default ??
  (slugifyModule as unknown as (input: string, options?: object) => string);

export function slugify(input: string, locale?: string): string {
  return slugifyLib(input, {
    lower: true,
    strict: true,
    locale,
  });
}
