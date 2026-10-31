// A click-type listener on an element outside a handful of roles has NVDA announce «clickable» — a table row, a
// sortable header and a list item each read «clickable» (measured). Their handlers are heard on the shadow root
// (`src/elements/delegate.ts`); the oracle reads the listeners the browser holds (`clickable.ts`).
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import { clickableNoise } from './clickable.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
afterEach(() => { document.body.innerHTML = ''; });

async function mount(spec: unknown): Promise<HTMLElement> {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = spec;
  document.body.appendChild(w);
  await w.updateComplete;
  await sleep(80);
  for (const el of w.shadowRoot!.querySelectorAll('*')) await (el as { updateComplete?: Promise<unknown> }).updateComplete;
  await sleep(50);
  return w;
}

const noiseOf = async (el: Element) =>
  [...new Set((await clickableNoise(el)).map((n) => `${n.element} (${n.role}) ${n.types.join('+')}`))];

const data = [{ city: 'Seoul', n: 3 }, { city: 'Busan', n: 2 }];

describe('click-type listeners screen readers would announce as «clickable»', () => {
  it('none on a sortable table with clickable rows', async () => {
    expect(await noiseOf(await mount({ widget: 'table', data }))).toEqual([]);
  });

  it('none on a list', async () => {
    expect(await noiseOf(await mount({ widget: 'list', data }))).toEqual([]);
  });
});
