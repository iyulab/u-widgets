/**
 * Shared utility functions for u-widgets core modules.
 */

/**
 * Detect if a string value looks like a date.
 * Matches common patterns: YYYY-MM-DD, ISO 8601, MM/DD/YYYY, YYYY/MM/DD, month names.
 *
 * @param value - The string to test.
 * @returns `true` if the string resembles a date format.
 */
export function isDateLikeString(value: string): boolean {
  if (!value || value.length < 6 || value.length > 30) return false;
  // ISO 8601 (2024-01-15, 2024-01-15T10:30:00Z)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return true;
  // MM/DD/YYYY or DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return true;
  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) return true;
  // Month names: "Jan 2024", "January 15, 2024"
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(value)) return true;
  return false;
}
