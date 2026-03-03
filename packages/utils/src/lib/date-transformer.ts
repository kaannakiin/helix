import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export type DateFormatStyle = 'standard' | 'compact' | 'full' | 'relative';

export class DateTransformer {
  private static getDayjs(value: string | Date, tz?: string) {
    return tz ? dayjs(value).tz(tz) : dayjs(value);
  }

  public static getSafeLocale(locale: string = 'en') {
    const l = locale.toLowerCase();
    if (l.startsWith('tr')) return 'tr';
    return l;
  }

  static formatDate(
    value: string | Date | null | undefined,
    locale: string = 'en',
    tz?: string,
    style: DateFormatStyle = 'standard'
  ): string {
    if (!value) return '';
    const safeLoc = this.getSafeLocale(locale);
    const d = this.getDayjs(value, tz).locale(safeLoc);

    if (style === 'relative') {
      return d.fromNow();
    }

    if (safeLoc === 'tr') {
      switch (style) {
        case 'compact':
          return d.format('DD.MM.YY');
        case 'full':
          return d.format('DD MMMM YYYY');
        case 'standard':
        default:
          return d.format('DD.MM.YYYY');
      }
    }

    switch (style) {
      case 'compact':
        return d.format('l');
      case 'full':
        return d.format('LL');
      case 'standard':
      default:
        return d.format('L');
    }
  }

  static formatDateTime(
    value: string | Date | null | undefined,
    locale: string = 'en',
    tz?: string,
    style: DateFormatStyle = 'standard'
  ): string {
    if (!value) return '';
    const safeLoc = this.getSafeLocale(locale);
    const d = this.getDayjs(value, tz).locale(safeLoc);

    if (style === 'relative') {
      return d.fromNow();
    }

    if (safeLoc === 'tr') {
      switch (style) {
        case 'compact':
          return d.format('DD.MM.YY HH:mm');
        case 'full':
          return d.format('DD MMMM YYYY, HH:mm');
        case 'standard':
        default:
          return d.format('DD.MM.YYYY HH:mm');
      }
    }

    switch (style) {
      case 'compact':
        return d.format('M/D/YY HH:mm');
      case 'full':
        return d.format('dddd, MMMM D, YYYY, HH:mm');
      case 'standard':
      default:
        return d.format('MM/DD/YYYY HH:mm');
    }
  }

  static formatTime(
    value: string | Date | null | undefined,
    locale: string = 'en',
    tz?: string
  ): string {
    if (!value) return '';
    const safeLoc = this.getSafeLocale(locale);
    const d = this.getDayjs(value, tz).locale(safeLoc);

    if (safeLoc === 'tr') {
      return d.format('HH:mm');
    }
    return d.format('HH:mm');
  }
}
