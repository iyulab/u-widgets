/**
 * Widget name suggestion for typo detection.
 *
 * Compares an unrecognized widget name against all known types
 * using Levenshtein distance and returns the closest match.
 */

/** All known widget type identifiers. */
const KNOWN_WIDGETS: readonly string[] = [
  'chart.bar', 'chart.line', 'chart.area', 'chart.pie',
  'chart.scatter', 'chart.radar', 'chart.heatmap', 'chart.box',
  'chart.funnel', 'chart.waterfall', 'chart.treemap',
  'metric', 'stat-group', 'gauge', 'progress',
  'table', 'list', 'form', 'confirm', 'compose',
  'markdown', 'image', 'callout',
];

/**
 * Suggest a known widget name for a potentially mistyped input.
 *
 * Returns the closest match if the Levenshtein distance is within
 * a reasonable threshold (max 3, and less than half the input length).
 * Returns `undefined` if no good match is found.
 *
 * @param input - The unrecognized widget name.
 * @returns The suggested widget name, or `undefined`.
 *
 * @example
 * ```ts
 * suggestWidget('chart.barr') // → 'chart.bar'
 * suggestWidget('metrc')      // → 'metric'
 * suggestWidget('xyzabc')     // → undefined
 * ```
 */
export function suggestWidget(input: string): string | undefined {
  if (!input) return undefined;

  const lower = input.toLowerCase();
  let bestMatch: string | undefined;
  let bestDist = Infinity;

  for (const known of KNOWN_WIDGETS) {
    const dist = levenshtein(lower, known);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = known;
    }
  }

  // Threshold: max distance 3, and less than half the input length
  const maxDist = Math.min(3, Math.floor(lower.length / 2));
  if (bestDist <= maxDist && bestDist > 0) {
    return bestMatch;
  }

  return undefined;
}

/**
 * Compute the Levenshtein distance between two strings.
 * Uses the Wagner–Fischer dynamic programming algorithm.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimize for empty strings
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP to save memory
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    row[0] = i;

    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        row[j] + 1,       // deletion
        row[j - 1] + 1,   // insertion
        prev + cost,       // substitution
      );
      prev = row[j];
      row[j] = val;
    }
  }

  return row[n];
}
