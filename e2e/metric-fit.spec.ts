import { test, expect } from '@playwright/test';

/**
 * A metric with a sparkline in a host shorter than it would grow — a KPI card a board gives a fixed height. The
 * sparkline gives up its room first: the card stays inside its box instead of running onto the next one. Measured in
 * a browser, as `height-model.spec.ts` measures (happy-dom lays nothing out).
 */
const SPEC = {
  widget: 'metric',
  data: { label: '빌딩 총 부하', value: 342.7, unit: 'kW', change: 4.2, trend: 'up', sparkline: [318, 322, 315, 330, 338, 329, 342.7] },
};

async function measure(page: import('@playwright/test').Page, hostStyle: string) {
  return page.evaluate(
    async ({ spec, hostStyle }) => {
      const host = document.createElement('u-widget') as HTMLElement & { spec?: unknown };
      host.setAttribute('style', `width:280px;${hostStyle}`);
      host.spec = spec;
      document.body.appendChild(host);
      await new Promise((r) => setTimeout(r, 700));
      const box = host.getBoundingClientRect();
      let deepest = box.bottom;
      let spark: DOMRect | null = null;
      const walk = (root: ParentNode) => {
        for (const el of Array.from(root.children)) {
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.bottom > deepest) deepest = r.bottom;
          if (el.matches('.metric-sparkline')) spark = r;
          const sr = (el as HTMLElement).shadowRoot;
          if (sr) walk(sr);
          walk(el);
        }
      };
      walk(host.shadowRoot ?? host);
      host.remove();
      return { host: Math.round(box.height), overflow: Math.round(deepest - box.bottom), spark: spark ? Math.round((spark as DOMRect).height) : null };
    },
    { spec: SPEC, hostStyle },
  );
}

test('a metric’s sparkline shrinks to the host’s height before the card runs past it', async ({ page }) => {
  await page.goto('/demo/');
  await page.waitForFunction(() => customElements.get('u-widget') !== undefined, { timeout: 15_000 });

  // Unconstrained: the sparkline has its full 28 px, and nothing runs past the card.
  const natural = await measure(page, '');
  expect(natural.spark, JSON.stringify(natural)).toBe(28);
  expect(natural.overflow).toBeLessThanOrEqual(1);

  // A host 16 px shorter than that: the sparkline takes the cut, the card stays inside it.
  const tight = await measure(page, `height:${natural.host - 16}px`);
  expect(tight.overflow, JSON.stringify(tight)).toBeLessThanOrEqual(1);
  expect(tight.spark!).toBeLessThanOrEqual(13);
});
