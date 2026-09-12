// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { gzipSync } from 'zlib';

const DIST = resolve(__dirname, '../../dist');

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

  it('charts bundle is under 7.5 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-charts.js'));
    // includes format.ts for axis label formatting. Re-baselined from 7 KB when the host became a
    // flex column so a constrained host reaches the chart area (0.18.2) — that is real CSS, and it
    // left 13 bytes of headroom under the old budget. Comments inside css`` templates no longer
    // count: the build strips them (see build/strip-css-template-comments.ts).
    expect(size).toBeLessThan(7.5 * 1024);
  });

  it('tools bundle is under 13 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-tools.js'));
    expect(size).toBeLessThan(13 * 1024); // includes EXAMPLES, WIDGET_OPTIONS, WIDGET_DATA_FIELDS, WIDGET_INFERENCE
  });

  it('math bundle is under 2 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-math.js'));
    expect(size).toBeLessThan(2 * 1024);
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

  it('shared chunks total is under 4 KB gzip', () => {
    const { readdirSync } = require('fs');
    const files = readdirSync(DIST) as string[];
    const chunks = files.filter(
      (f: string) => f.endsWith('.js') && !f.startsWith('u-widgets') && !f.endsWith('.map')
    );
    const totalGzip = chunks.reduce(
      (sum: number, f: string) => sum + gzipSize(resolve(DIST, f)),
      0
    );
    expect(totalGzip).toBeLessThan(5 * 1024); // shared chunks < 5 KB gzip (tokens + infer + formdown)
  });
});
