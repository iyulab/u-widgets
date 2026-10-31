type FormatType = 'number' | 'compact' | 'currency' | 'percent' | 'date' | 'datetime' | 'time' | 'bytes';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Reads a spreadsheet number-format code (`#,##0.00`, `0.0%`, `#,##0;[Red](#,##0)`). Answers `null` when the code uses
 * syntax it does not support. A code's section color (`[Red]`) may come back as a `tone`; `formatValue` writes the text
 * and leaves the tone to the host.
 */
export type NumberCodeReader = (value: unknown, code: string, locale?: string) => { text: string; tone?: string } | null;

let codeReader: NumberCodeReader | undefined;

/**
 * Turn on reading of spreadsheet format codes — what `@iyulab/u-widgets/components` does by importing it, with the
 * engine `@iyulab/components` shares with its table and sheet. Without a reader a code-shaped `format` is written as
 * the plain value, with a console warning.
 */
export function setNumberCodeReader(reader: NumberCodeReader | undefined): void {
  codeReader = reader;
}

/** A `format` that is none of u-widgets' words but carries a digit placeholder (`0` `#` `?`) is a spreadsheet code. */
function isNumberCode(format: string | undefined): format is string {
  return format !== undefined && /[0#?]/.test(format);
}

const warned = new Set<string>();

function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[@iyulab/u-widgets] ${message}`);
}

function formatByCode(value: unknown, code: string, locale?: string): string {
  if (!codeReader) {
    warnOnce(`format "${code}" is a spreadsheet number-format code — import '@iyulab/u-widgets/components' to read it; the value is shown as is.`);
    return String(value);
  }
  // A reader answers `null` for syntax it does not support, but a code can also be one the platform cannot write (more
  // integer digit placeholders than `Intl.NumberFormat` takes throws a RangeError) — a widget never fails to draw over a format.
  let read: ReturnType<NumberCodeReader> = null;
  try {
    read = codeReader(value, code, locale);
  } catch {
    // shown as is, below
  }
  if (read) return read.text;
  warnOnce(`format "${code}" uses syntax the number-format engine does not support — the value is shown as is.`);
  return String(value);
}

// ISO 4217 zero-decimal currencies — no fractional digits by standard
const ZERO_DECIMAL_CURRENCIES = new Set([
  'KRW', 'JPY', 'VND', 'IDR', 'BIF', 'CLP', 'GNF', 'ISK',
  'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'UYI', 'VUV', 'XAF', 'XOF', 'XPF',
]);

/**
 * Format a value according to a format hint string.
 *
 * Supported formats: `"number"` (a value too small for three fraction digits keeps four significant digits, in
 * scientific notation — `7.729E-8`), `"number:2"` (fixed fraction digits), `"compact"`, `"compact:2"` (`1.2K`, `3.4M` — up to
 * that many fraction digits, one by default), `"compact:KRW"` (a currency, compact — `₩1.2억`), `"currency"`,
 * `"currency:EUR"`, `"percent"`, `"percent:1"`, `"date"`, `"datetime"`, `"time"`, `"bytes"`. Returns `String(value)` for
 * unknown formats, except a spreadsheet number-format code (`"#,##0.00"`, `"0.0%"`), which `@iyulab/u-widgets/components`
 * reads with the engine `@iyulab/components` shares with its table and sheet. It is the one grammar a format is written in — a value's `format`, a column's, a chart axis's.
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
 * formatValue(0.97444, 'number:4')    // "0.9744"
 * formatValue(7.7291e-8, 'number')    // "7.729E-8"
 * formatValue(-0.00001, 'number:2')   // "0.00" — never "-0.00"
 * formatValue(1234567, 'compact')     // "1.2M"
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
      return formatNumber(value, locale, digits(param));
    case 'compact':
      return formatCompact(value, param, locale);
    case 'currency':
      return formatCurrency(value, param, locale);
    case 'percent':
      return formatPercent(value, locale, digits(param));
    case 'date':
      return formatDate(value, locale);
    case 'datetime':
      return formatDatetime(value, locale);
    case 'time':
      return formatTime(value, locale);
    case 'bytes':
      return formatBytes(value);
    default:
      return isNumberCode(format) ? formatByCode(value, format, locale) : String(value);
  }
}

/** `number:2` · `percent:1` — the fraction digits after the colon (0–20), or `undefined` when absent or not a count. */
function digits(param: string | undefined): number | undefined {
  if (param === undefined || !/^\d{1,2}$/.test(param)) return undefined;
  const n = Number(param);
  return n <= 20 ? n : undefined;
}

/**
 * Format with `nf`, never as a signed zero: a negative value that rounds to zero is written as zero — the sign of
 * something too small to show is not information, and «-0» / «-0.00» reads as a defect.
 */
function fmt(nf: Intl.NumberFormat, num: number): string {
  const text = nf.format(num);
  return (num < 0 || Object.is(num, -0)) && text === nf.format(-0) ? nf.format(0) : text;
}

/**
 * Below this, the default of `number` (at most three fraction digits) would write a nonzero value as `0`.
 * Such a value is written in scientific notation with four significant digits instead (`7.729E-8`).
 */
const SMALLEST_FIXED = 0.0005;

function formatNumber(value: unknown, locale?: string, fractionDigits?: number): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  // `number` without digits names no scale — a value it would erase keeps its significant digits.
  // `number:N` names the scale: fixed-point, as asked.
  const fixed: Intl.NumberFormatOptions =
    fractionDigits !== undefined
      ? { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }
      : num !== 0 && Math.abs(num) < SMALLEST_FIXED
        ? { notation: 'scientific', maximumSignificantDigits: 4 }
        : {};
  try {
    return fmt(new Intl.NumberFormat(locale, fixed), num);
  } catch {
    return fmt(new Intl.NumberFormat(undefined, fixed), num);
  }
}

/** `compact` · `compact:2` (fraction digits, one by default) · `compact:KRW` (a currency, compact). */
function formatCompact(value: unknown, param: string | undefined, locale?: string): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  const currency = param !== undefined && /^[A-Za-z]{3}$/.test(param) ? param.toUpperCase() : undefined;
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: currency ? 1 : (digits(param) ?? 1),
    ...(currency && { style: 'currency', currency }),
  };
  try {
    return fmt(new Intl.NumberFormat(locale ?? (currency ? 'en-US' : undefined), options), num);
  } catch {
    return fmt(new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }), num);
  }
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
    return fmt(new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      ...(isZeroDecimal && {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    }), num);
  } catch {
    return fmt(new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: 'USD',
    }), num);
  }
}

function formatPercent(value: unknown, locale?: string, fractionDigits?: number): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (locale) {
    try {
      return fmt(new Intl.NumberFormat(locale, {
        style: 'percent',
        ...(fractionDigits === undefined
          ? { maximumFractionDigits: 2 }
          : { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }),
      }), num / 100);
    } catch {
      // Invalid locale fallback
    }
  }
  const text = fractionDigits === undefined ? String(num) : num.toFixed(fractionDigits);
  return (Number(text) === 0 ? text.replace(/^-/, '') : text) + '%';
}

/** A date (and time) as a string writes it: ISO 8601 (`2025-01-15T14:30:00Z`) and the variations APIs use —
 *  a space or dots between the parts (`2025-01-15 14:30`, `2025.01.15`) — or compact digits (`20250115`,
 *  `202501151430`, `20250115 1430`). `offset` is the string's own (`Z`, `+09:00`, `+0900`, `+09`), when it gives one. */
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

const DELIMITED_DATE = /^(\d{4})[-./](\d{2})[-./](\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;
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
    // `+09`, `+0900` and `+09:00` are one offset; the Date parser takes only the last.
    const offset = /^z$/i.test(p.offset) ? 'Z' : p.offset.replace(/^([+-]\d{2}):?(\d{2})?$/, (_, hours: string, minutes?: string) => `${hours}:${minutes ?? '00'}`);
    return new Date(`${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour ?? 0)}:${pad(p.minute ?? 0)}:${pad(p.second ?? 0)}${p.rest}${offset}`);
  }
  return new Date(p.year, p.month - 1, p.day, p.hour ?? 0, p.minute ?? 0, p.second ?? 0);
}

/**
 * Reads date text by the same rule the date formats use — `null` when it is not a real date in one of their
 * shapes. A date alone is local midnight (`Date.parse('2026-01-01')` is UTC midnight: the previous evening west
 * of UTC, nine hours into the day in Seoul); a date-time without an offset is local wall clock; one with an offset
 * is that moment.
 */
export function parseDateText(value: string): Date | null {
  const parts = dateParts(value);
  return parts ? instantOf(parts) : null;
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

/** The time of day alone — what an axis of hours or a "last updated" cell needs. A date without a time of day
 *  has none to show, and is shown as written. */
function formatTime(value: unknown, locale?: string): string {
  const parts = typeof value === 'string' ? dateParts(value) : null;
  if (!parts || parts.hour === undefined) return String(value);
  if (locale) {
    try {
      return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(instantOf(parts));
    } catch {
      // Invalid locale fallback
    }
  }
  return `${pad(parts.hour)}:${pad(parts.minute ?? 0)}`;
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
