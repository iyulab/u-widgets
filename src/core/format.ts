type FormatType = 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'bytes';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

// ISO 4217 zero-decimal currencies — no fractional digits by standard
const ZERO_DECIMAL_CURRENCIES = new Set([
  'KRW', 'JPY', 'VND', 'IDR', 'BIF', 'CLP', 'GNF', 'ISK',
  'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'UYI', 'VUV', 'XAF', 'XOF', 'XPF',
]);

/**
 * Format a value according to a format hint string.
 *
 * Supported formats: `"number"`, `"currency"`, `"currency:EUR"`, `"percent"`,
 * `"date"`, `"datetime"`, `"bytes"`. Returns `String(value)` for unknown formats.
 *
 * @param value - The value to format (coerced to number where needed).
 * @param format - Format hint, optionally with a parameter after `:` (e.g., `"currency:USD"`).
 * @param locale - BCP 47 locale tag for number/currency formatting. Falls back to browser default.
 * @returns Formatted string. Null/undefined values render as `—` (em-dash) so
 * empty cells in tables/metrics are visually distinct from "0".
 *
 * @example
 * ```ts
 * formatValue(1234.5, 'number')       // "1,234.5"
 * formatValue(1234.5, 'currency:EUR') // "€1,234.50"
 * formatValue(73, 'percent')          // "73%"
 * formatValue(1536000, 'bytes')       // "1.5 MB"
 * formatValue(null, 'currency:KRW')   // "—"
 * ```
 */
export function formatValue(value: unknown, format?: string, locale?: string): string {
  if (value == null) return '—';

  // Parse format string: 'currency:USD' → type='currency', param='USD'
  const [type, param] = format?.split(':') ?? [];

  switch (type as FormatType) {
    case 'number':
      return formatNumber(value, locale);
    case 'currency':
      return formatCurrency(value, param, locale);
    case 'percent':
      return formatPercent(value, locale);
    case 'date':
      return formatDate(value, locale);
    case 'datetime':
      return formatDatetime(value, locale);
    case 'bytes':
      return formatBytes(value);
    default:
      return String(value);
  }
}

function formatNumber(value: unknown, locale?: string): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat(locale).format(num);
}

function formatCurrency(value: unknown, currencyCode?: string, locale?: string): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  const currency = currencyCode || 'USD';
  // Default to en-US so symbol rendering (e.g. "$" not "US$") stays consistent
  // regardless of the host OS locale when the caller doesn't specify one.
  const resolvedLocale = locale ?? 'en-US';
  try {
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      ...(isZeroDecimal && {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    }).format(num);
  } catch {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  }
}

function formatPercent(value: unknown, locale?: string): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (locale) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 2,
      }).format(num / 100);
    } catch {
      // Invalid locale fallback
    }
  }
  return num + '%';
}

/** A date (and time) as a string writes it: ISO 8601 (`2025-01-15T14:30:00Z`) and the variations APIs use —
 *  a space or dots between the parts (`2025-01-15 14:30`, `2025.01.15`) — or compact digits (`20250115`,
 *  `202501151430`, `20250115 1430`). `offset` is the string's own (`Z`, `+09:00`), when it gives one. */
interface DateParts {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  rest: string;
  offset?: string;
}

const DELIMITED_DATE = /^(\d{4})[-./](\d{2})[-./](\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
const COMPACT_DATE = /^(\d{4})(\d{2})(\d{2})(?:[T ]?(\d{2})(\d{2})(\d{2})?)?$/;

function dateParts(value: string): DateParts | null {
  const text = value.trim();
  const match = DELIMITED_DATE.exec(text) ?? COMPACT_DATE.exec(text);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, fraction, offset] = match;
  const parts: DateParts = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    ...(h !== undefined && { hour: Number(h), minute: Number(mi), second: Number(s ?? 0) }),
    rest: fraction ?? '',
    ...(offset !== undefined && { offset }),
  };
  // A month 13 or the 31st of a 30-day month is not a date — digits like that are an id or a code.
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour ?? 0, parts.minute ?? 0, parts.second ?? 0));
  if (
    check.getUTCMonth() !== parts.month - 1 ||
    check.getUTCDate() !== parts.day ||
    check.getUTCHours() !== (parts.hour ?? 0) ||
    check.getUTCMinutes() !== (parts.minute ?? 0)
  ) {
    return null;
  }
  return parts;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The instant the parts name: with the string's own offset, the moment it gives; without one, the wall-clock
 *  time it writes, read in the local time zone — a date alone is its local midnight, not UTC's, so it stays
 *  on its own day west of UTC. */
function instantOf(p: DateParts): Date {
  if (p.offset) {
    const offset = /^z$/i.test(p.offset) ? 'Z' : p.offset.replace(/^([+-]\d{2}):?(\d{2})$/, '$1:$2');
    return new Date(`${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour ?? 0)}:${pad(p.minute ?? 0)}:${pad(p.second ?? 0)}${p.rest}${offset}`);
  }
  return new Date(p.year, p.month - 1, p.day, p.hour ?? 0, p.minute ?? 0, p.second ?? 0);
}

function formatDate(value: unknown, locale?: string): string {
  const parts = typeof value === 'string' ? dateParts(value) : null;
  if (!parts) return String(value);
  if (locale) {
    try {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(instantOf(parts));
    } catch {
      // Invalid locale fallback
    }
  }
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function formatDatetime(value: unknown, locale?: string): string {
  const parts = typeof value === 'string' ? dateParts(value) : null;
  if (!parts) return String(value);
  if (locale) {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(instantOf(parts));
    } catch {
      // Invalid locale fallback
    }
  }
  const date = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
  return parts.hour === undefined ? date : `${date} ${pad(parts.hour)}:${pad(parts.minute ?? 0)}`;
}

function formatBytes(value: unknown): string {
  const raw = Number(value);
  if (isNaN(raw)) return String(value);

  const sign = raw < 0 ? '-' : '';
  let num = Math.abs(raw);

  let i = 0;
  while (num >= 1024 && i < BYTE_UNITS.length - 1) {
    num /= 1024;
    i++;
  }
  return sign + (i === 0 ? num : num.toFixed(1)) + ' ' + BYTE_UNITS[i];
}
