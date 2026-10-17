/**
 * The one HTML escape of this package. It is safe in a text node and in a quoted attribute value, so a value can move
 * from one to the other (markdown output puts escaped text in both) without a second pass — and without a rule per file.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
