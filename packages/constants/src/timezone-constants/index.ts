export const TIMEZONES = Intl.supportedValuesOf('timeZone');

export type Timezone = (typeof TIMEZONES)[number];

export const TIMEZONE_OPTIONS = TIMEZONES.map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
}));
