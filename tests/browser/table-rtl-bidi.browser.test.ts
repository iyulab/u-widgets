// A cell value is data the app put there. In a right-to-left page a Latin value (a company name, a part number) took the page
// as its paragraph direction, so its full stop and a leading sign jumped to the other end — "Blue Harbor Co." read
// ".Blue Harbor Co". Each value is isolated (`<bdi>`): it reads in its own direction and stands where the cell puts it.
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
afterEach(() => { document.body.innerHTML = ''; document.documentElement.dir = 'ltr'; });

async function mount(dir: 'ltr' | 'rtl', text: string) {
  document.documentElement.dir = dir;
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.style.display = 'block';
  w.style.width = '380px';
  w.spec = { widget: 'table', data: [{ name: text }], columns: [{ field: 'name', label: 'Name' }] };
  document.body.appendChild(w);
  await w.updateComplete;
  await sleep(50);
  const t = w.shadowRoot!.querySelector('uw-table') as HTMLElement & { updateComplete: Promise<unknown> };
  await t.updateComplete;
  const td = [...t.shadowRoot!.querySelectorAll<HTMLElement>('tbody td')].find((c) => c.textContent?.trim() === text)!;
  const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node && node.data.trim() !== text) node = walker.nextNode() as Text | null;
  const range = document.createRange();
  range.setStart(node!, 0);
  range.setEnd(node!, 1);
  const first = range.getBoundingClientRect();
  range.setStart(node!, node!.data.length - 1);
  range.setEnd(node!, node!.data.length);
  const last = range.getBoundingClientRect();
  return { first: first.left, last: last.left, cell: td.getBoundingClientRect() };
}

describe('uw-table — a value keeps its own direction in a cell', () => {
  it('in a right-to-left page a Latin value reads left to right — the full stop stands after the last word', async () => {
    const e = await mount('rtl', 'Blue Harbor Co.');
    expect(e.last).toBeGreaterThan(e.first);
  });

  it('NEGATIVE: in a left-to-right page the value stands as before', async () => {
    const e = await mount('ltr', 'Blue Harbor Co.');
    expect(e.last).toBeGreaterThan(e.first);
    expect(e.first - e.cell.left).toBeLessThan(30);
  });
});
