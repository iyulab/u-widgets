// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const SRC_ELEMENTS = resolve(__dirname, '../../src/elements');

// The four literal rem values previously duplicated across element styles, now
// expected to be referenced via the typography-scale tokens in styles/tokens.ts.
const RAW_LITERAL_PATTERNS = [
  /font-size:\s*0\.8125rem\b/, // label tier
  /font-size:\s*0\.75rem\b/,   // caption tier
  /font-size:\s*0\.875rem\b/,  // body tier (existing --u-widget-font-size token)
  /font-size:\s*0\.6875rem\b/, // overline tier
];

describe('typography scale adoption — no stray literal font-sizes', () => {
  const files = readdirSync(SRC_ELEMENTS).filter(f => f.endsWith('.ts'));

  it('scans at least one element source file (sanity check on the scan itself)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} does not hardcode a scale-tier font-size outside a var() fallback`, () => {
      const content = readFileSync(resolve(SRC_ELEMENTS, file), 'utf-8');
      for (const pattern of RAW_LITERAL_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    });
  }
});
