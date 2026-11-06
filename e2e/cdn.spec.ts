import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The CDN script — `<script src="…/echarts.min.js">` then `<script src="…/u-widgets.global.js">`, the way the README
 * tells a plain page to load it — draws a chart. It is built here, from this tree, and loaded with the real full
 * `echarts` build: the unit test of the chart module's registration guards one line, this guards what a page sees.
 * (It threw while loading, "reading 'install'", and every chart stayed a "module not loaded" notice.)
 */
const root = fileURLToPath(new URL('..', import.meta.url));
let out = '';

test.beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'uw-cdn-'));
  execFileSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'vite.cdn.config.ts', '--outDir', out], { cwd: root, stdio: 'pipe' });
});
test.afterAll(() => {
  if (out) rmSync(out, { recursive: true, force: true });
});

test('a page that loads echarts and the CDN script draws a chart widget', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setContent('<!doctype html><body><u-widget id="w" style="display:block;width:420px;height:260px"></u-widget></body>');
  await page.addScriptTag({ path: join(root, 'node_modules/echarts/dist/echarts.min.js') });
  await page.addScriptTag({ path: join(out, 'u-widgets.global.js') });
  await page.evaluate(() => {
    const w = document.getElementById('w') as HTMLElement & { spec: unknown };
    w.spec = { widget: 'chart.bar', data: [{ c: 'Mon', v: 10 }, { c: 'Tue', v: 25 }], mapping: { x: 'c', y: 'v' }, options: { animate: false } };
  });
  // The chart draws into a canvas inside the widget's shadow roots.
  await page.waitForFunction(() => {
    const has = (root: ShadowRoot | undefined): boolean =>
      !!root && (!!root.querySelector('canvas') || Array.from(root.querySelectorAll('*')).some(el => has(el.shadowRoot ?? undefined)));
    return has(document.getElementById('w')?.shadowRoot ?? undefined);
  }, undefined, { timeout: 10_000 });
  const notice = await page.evaluate(() => document.getElementById('w')?.shadowRoot?.textContent ?? '');
  expect(notice).not.toContain('module not loaded');
  expect(errors).toEqual([]);
});
