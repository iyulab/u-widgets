// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

// The build strips every `declare global` block from the bundled .d.ts and appends one hand-written
// block (vite.config.ts → globalDeclarationsBlock). A merge declared in src but not mirrored there
// is silently absent from the published types — `u-widget-event` shipped untyped in 0.25.1 that
// way while the source typecheck was green. So the keys are derived from src and looked up in
// the built files, which is what a consumer's compiler reads.
const SRC = resolve(__dirname, '../../src');
const DIST = resolve(__dirname, '../../dist');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) return sourceFiles(full);
    return e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') ? [full] : [];
  });
}

/** Keys declared inside `interface <name> { … }` within a `declare global` block in src. */
function globalKeys(interfaceName: string): string[] {
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('declare global')) continue;
    for (const m of text.matchAll(new RegExp(`interface ${interfaceName}\\s*\\{([^}]*)\\}`, 'g'))) {
      for (const k of m[1].matchAll(/['"]([a-z][a-z0-9-]*)['"]\s*:/g)) keys.add(k[1]);
    }
  }
  return [...keys].sort();
}

describe('published global declarations', () => {
  const dts = readFileSync(resolve(DIST, 'u-widgets.d.ts'), 'utf8');

  for (const iface of ['HTMLElementTagNameMap', 'GlobalEventHandlersEventMap']) {
    it(`every ${iface} key declared in src is in the built u-widgets.d.ts`, () => {
      const keys = globalKeys(iface);
      expect(keys.length, `no ${iface} merge found in src — the derivation broke`).toBeGreaterThan(0);
      const missing = keys.filter((k) => !new RegExp(`['"]${k}['"]\\s*:`).test(dts));
      expect(missing, 'mirror these in vite.config.ts globalDeclarationsBlock').toEqual([]);
    });
  }
});
