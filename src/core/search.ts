/**
 * What a table's search box counts as a match. Without a matcher: the cell text contains the query, case-insensitively,
 * and a syllable still being composed by an IME is not searched with (the table waits for the composition to end).
 */
export type SearchMatcher = (text: string, query: string, options: { composing?: boolean; locale?: string }) => boolean;

let matcher: SearchMatcher | undefined;

/**
 * Turn on the `@iyulab/components` search match — what `@iyulab/u-widgets/components` does by importing it: case and
 * diacritics folded (`Ä` finds `a`), Korean initials (`ㅅㅇ` finds `서울`), and a syllable being composed matched by
 * its keystrokes, so the rows narrow while typing — the same match its select and table filters use.
 */
export function setSearchMatcher(next: SearchMatcher | undefined): void {
  matcher = next;
}

/** Whether a query still being composed can be searched with — only a matcher that reads `composing` can. */
export function searchesWhileComposing(): boolean {
  return matcher !== undefined;
}

/** `text` contains `query` — by the matcher when one is set, else case-insensitively. An empty query matches all. */
export function matchesSearch(text: string, query: string, options: { composing?: boolean; locale?: string } = {}): boolean {
  if (matcher) return matcher(text, query, options);
  return text.toLowerCase().includes(query.toLowerCase());
}
