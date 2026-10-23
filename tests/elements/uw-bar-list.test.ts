import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/uw-bar-list.js';
import '../../src/elements/u-widget.js';

type El = HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
async function bars(data: unknown, options: Record<string, unknown> = {}) {
  const el = document.createElement('uw-bar-list') as El;
  el.spec = { widget: 'bar-list', title: 'Stock', data, options: { locale: 'en-US', ...options } };
  document.body.appendChild(el);
  await el.updateComplete;
  return el.shadowRoot!;
}

afterEach(() => { document.body.innerHTML = ''; });

const widths = (root: ShadowRoot) => [...root.querySelectorAll<HTMLElement>('.fill')].map(f => f.style.width);

describe('uw-bar-list', () => {
  it('draws a row per item — label, written value, a bar on the largest value — spoken as label and value', async () => {
    const root = await bars([
      { label: 'North', value: 40 },
      { label: 'South', value: 1234.5, format: 'number:1', unit: 'kg', tone: 'warn' },
      { label: 'East', value: 0 },
    ]);
    const rows = [...root.querySelectorAll('[part="row"]')];
    expect(rows.map(r => r.getAttribute('aria-label'))).toEqual(['North: 40', 'South: 1,234.5 kg', 'East: 0']);
    expect(rows.map(r => r.getAttribute('data-tone'))).toEqual([null, 'warn', null]);
    expect(widths(root)).toEqual(['3.2%', '100.0%', '0.0%']);
    expect(root.querySelector('[part="rows"]')?.getAttribute('aria-label')).toBe('Stock');
  });

  it('puts every bar on options.max, an item on its own max', async () => {
    const root = await bars([{ label: 'A', value: 25 }, { label: 'B', value: 9, max: 30 }, { label: 'C', value: 80 }], { max: 50 });
    expect(widths(root)).toEqual(['50.0%', '30.0%', '100.0%']);
  });

  it('leaves out an item with no label or no number', async () => {
    const root = await bars([{ label: 'A', value: 1 }, { value: 2 }, { label: 'C', value: 'n/a' }, { label: 'D' }, null]);
    expect(root.querySelectorAll('[part="row"]')).toHaveLength(1);
    expect(await bars([])).toBeTruthy();
    expect((await bars([{ value: 1 }])).querySelector('[part="rows"]')).toBeNull();
  });

  it('writes a note under the bar', async () => {
    const root = await bars([{ label: 'Tetanus', value: 9, note: 'Order placed' }]);
    expect(root.querySelector('.note')?.textContent).toBe('Order placed');
  });

  it('draws a pictogram — a glyph per glyphValue, the rest of the scale faint', async () => {
    const root = await bars([{ label: 'Waiting', value: 25 }, { label: 'Back', value: 10 }], { form: 'pictogram', glyph: '☎', glyphValue: 5, max: 40 });
    const glyphs = [...root.querySelectorAll('.glyphs')];
    expect(glyphs.map(g => g.textContent)).toEqual(['☎'.repeat(8), '☎'.repeat(8)]);
    expect(glyphs.map(g => g.querySelector('.rest')?.textContent)).toEqual(['☎'.repeat(3), '☎'.repeat(6)]);
    expect(root.querySelector('.bar')).toBeNull();
  });

  it('draws a bar for a row that would need too many glyphs to count', async () => {
    const root = await bars([{ label: 'Few', value: 6 }, { label: 'Many', value: 500 }], { form: 'pictogram', max: 6 });
    expect(root.querySelectorAll('.glyphs')).toHaveLength(1);
    expect(root.querySelectorAll('.bar')).toHaveLength(1);
  });

  it('shows options.maxItems rows and says how many more', async () => {
    const root = await bars([1, 2, 3, 4].map(n => ({ label: `L${n}`, value: n })), { maxItems: 2 });
    expect(root.querySelectorAll('[part="row"]')).toHaveLength(2);
    expect(root.querySelector('[part="more"]')?.textContent).toBe('+2 more');
  });

  it('is drawn by <u-widget>', async () => {
    const el = document.createElement('u-widget') as El;
    el.spec = { widget: 'bar-list', data: [{ label: 'A', value: 1 }] };
    document.body.appendChild(el);
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector('uw-bar-list') as El | null;
    expect(inner).not.toBeNull();
    await inner!.updateComplete;
    expect(inner!.shadowRoot!.querySelectorAll('[part="row"]')).toHaveLength(1);
  });
});
