type FormatType = 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'bytes';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Format a value according to a format hint string.
 *
 * Supported formats: `"number"`, `"currency"`, `"currency:EUR"`, `"percent"`,
 * `"date"`, `"datetime"`, `"bytes"`. Returns `String(value)` for unknown formats.
 *
 * @param value - The value to format (coerced to number where needed).
 * @param format - Format hint, optionally with a parameter after `:` (e.g., `"currency:USD"`).
 * @param locale - BCP 47 locale tag for number/currency formatting. Falls back to browser default.
 * @returns Formatted string, or empty string if value is null/undefined.
 *
 * @example
 * ```ts
 * formatValue(1234.5, 'number')       // "1,234.5"
 * formatValue(1234.5, 'currency:EUR') // "€1,234.50"
 * formatValue(73, 'percent')          // "73%"
 * formatValue(1536000, 'bytes')       // "1.5 MB"
 * ```
 */
export function formatValue(value: unknown, format?: string, locale?: string): string {
  if (value == null) return '';

  // Parse format string: 'currency:USD' → type='currency', param='USD'
  const [type, param] = format?.split(':') ?? [];

  switch (type as FormatType) {
    case 'number':
      return formatNumber(value, locale);
    case 'currency':
      return formatCurrency(value, param, locale);
    case 'percent':
      return formatPercent(value);
    case 'date':
      return formatDate(value);
    case 'datetime':
      return formatDatetime(value);
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
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode || 'USD',
    }).format(num);
  } catch {
    // Invalid currency code fallback
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  }
}

function formatPercent(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num + '%';
}

function formatDate(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value);
}

function formatDatetime(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 16).replace('T', ' ');
  }
  return String(value);
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
