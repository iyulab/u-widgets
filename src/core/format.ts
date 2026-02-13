type FormatType = 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'bytes';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatValue(value: unknown, format?: string): string {
  if (value == null) return '';

  switch (format as FormatType) {
    case 'number':
      return formatNumber(value);
    case 'currency':
      return formatCurrency(value);
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

function formatNumber(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US');
}

function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return '\u20A9' + num.toLocaleString('en-US');
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
