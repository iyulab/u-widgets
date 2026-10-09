// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { gzipSync } from 'zlib';

const DIST = resolve(__dirname, '../../dist');

/** The shared chunk holding the editor names (`src/core/tool-labels.ts`). */
function toolLabelsChunk(): string {
  const name = readdirSync(DIST).find(f => /^tool-labels-.*\.js$/.test(f));
  if (!name) throw new Error('no tool-labels chunk in dist');
  return name;
}

function gzipSize(filePath: string): number {
  const content = readFileSync(filePath);
  return gzipSync(content).length;
}

function rawSize(filePath: string): number {
  return statSync(filePath).size;
}

/** Newest mtime under a directory tree. */
function newestMtime(dir: string): number {
  const { readdirSync } = require('fs');
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true }) as { name: string; isDirectory(): boolean }[]) {
    const full = resolve(dir, entry.name);
    const t = entry.isDirectory() ? newestMtime(full) : statSync(full).mtimeMs;
    if (t > newest) newest = t;
  }
  return newest;
}

describe('bundle size budget', () => {
  it('dist is not older than src — a stale build makes every budget below meaningless', () => {
    // These tests read dist without building it. That let the charts budget stay green locally
    // for two cycles while CI (which always builds first) was red: the dist on disk predated the
    // source it was supposed to measure. Fail loudly instead of measuring the wrong artifact.
    const srcNewest = newestMtime(resolve(__dirname, '../../src'));
    const distBuilt = statSync(resolve(DIST, 'u-widgets.js')).mtimeMs;
    expect(distBuilt, 'dist/ is older than src/ — run `npm run build` before reading bundle sizes')
      .toBeGreaterThanOrEqual(srcNewest);
  });

  it('core bundle (u-widgets.js) gzip size check', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets.js'));
    // Core includes all sub-components (sideEffects registration)
    // No hard limit — just track and report
    console.log(`  core gzip: ${(size / 1024).toFixed(2)} KB`);
    expect(size).toBeGreaterThan(0);
  });

  it('charts bundle is under 8.5 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-charts.js'));
    // includes format.ts for axis label formatting. Re-baselined from 7 KB when the host became a
    // flex column so a constrained host reaches the chart area (0.18.2) — that is real CSS, and it
    // left 13 bytes of headroom under the old budget. Comments inside css`` templates no longer
    // count: the build strips them (see build/strip-css-template-comments.ts).
    // Re-baselined from 7.5 KB for chart.gantt (0.20.0): measured 8.16 KB with it, the interval
    // builder itself (render item, tooltip, row ordering — infer() was already a shared chunk).
    // The four reference-line copies were merged into one helper first; that saved 37 bytes.
    expect(size).toBeLessThan(8.5 * 1024);
  });

  it('tools bundle (with its names chunk) is under 16.5 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-tools.js')) + gzipSize(resolve(DIST, toolLabelsChunk()));
    // includes EXAMPLES, WIDGET_OPTIONS, WIDGET_DATA_FIELDS, WIDGET_INFERENCE, OPTION_TYPES.
    // Re-baselined from 13 KB for chart.gantt's catalog entry, template and two examples (0.20.0,
    // measured 13.17 KB) — the examples are what `help('chart.gantt')` hands an author.
    // Re-baselined from 13.5 KB for OPTION_TYPES and getWidgetOptions (measured 14.11 KB) — the option
    // value types a property editor builds its controls from. The tools entry is separate from core.
    // Re-baselined from 14.5 KB for the editor names (English table and lookup, 1.7 KB in a chunk of
    // its own, shared with `./tools/locales/ko`; measured 16.3 KB together).
    expect(size).toBeLessThan(16.5 * 1024);
  });

  it('math bundle is under 2 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-math.js'));
    expect(size).toBeLessThan(2 * 1024);
  });

  it('Korean locale bundle is under 1.5 KB gzip and carries no copy of the locale registry', () => {
    const file = resolve(DIST, 'u-widgets-locale-ko.js');
    expect(gzipSize(file)).toBeLessThan(1.5 * 1024);
    // It registers into the registry the widgets read — a second copy would register into nothing.
    expect(readFileSync(file, 'utf-8')).not.toContain('Prev');
  });

  it('Korean editor-names bundle is under 2 KB gzip and carries no copy of the names registry', () => {
    const file = resolve(DIST, 'u-widgets-tools-locale-ko.js');
    expect(gzipSize(file)).toBeLessThan(2 * 1024);
    expect(readFileSync(file, 'utf-8')).not.toContain('Bar chart');
  });

  it('forms bundle is under 2 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-forms.js'));
    expect(size).toBeLessThan(2 * 1024);
  });

  it('core raw size check', () => {
    const size = rawSize(resolve(DIST, 'u-widgets.js'));
    console.log(`  core raw: ${(size / 1024).toFixed(2)} KB`);
    expect(size).toBeGreaterThan(0);
  });

  it('shared chunks total is under 7 KB gzip', () => {
    const { readdirSync } = require('fs');
    const files = readdirSync(DIST) as string[];
    // The editor names chunk is loaded only by `./tools` and its locales — counted in the tools budget.
    const chunks = files.filter(
      (f: string) => f.endsWith('.js') && !f.startsWith('u-widgets') && !f.endsWith('.map') && f !== toolLabelsChunk()
    );
    const totalGzip = chunks.reduce(
      (sum: number, f: string) => sum + gzipSize(resolve(DIST, f)),
      0
    );
    // Shared by the entries: format · decorate · infer · formdown (built-in parser + the option
    // grammar `value=Label`). 5.2 KB measured when the option grammar landed — a jump past 6 KB
    // means a dependency or a large module slipped into a shared chunk.
    // 0.26.0: + the locale module (English table, ~0.9 KB) — the `./components` entry calls `setDefaultLocale`, which
    // must be the same module instance the elements read, so it moved out of the core entry into a shared chunk
    // (6.3 KB measured). Bytes moved, not added.
    expect(totalGzip).toBeLessThan(7 * 1024);
  });
});
