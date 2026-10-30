import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/uw-status-grid.js';
import '../../src/elements/u-widget.js';

type El = HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
async function grid(data: unknown, options: Record<string, unknown> = {}) {
  const el = document.createElement('uw-status-grid') as El;
  el.spec = { widget: 'status-grid', title: 'Ward 4B', data, options: { locale: 'en-US', ...options } };
  document.body.appendChild(el);
  await el.updateComplete;
  return el.shadowRoot!;
}

afterEach(() => { document.body.innerHTML = ''; });

const beds = [
  { label: '01', tone: 'ok' }, { label: '02', tone: 'ok' }, { label: '03', tone: 'alarm', value: 38.6, format: 'number:1', unit: '°C' },
  { label: '04', tone: 'idle' }, { label: '05' },
];

describe('uw-status-grid', () => {
  it('draws one cell per item in its tone, its name and value inside and spoken whole', async () => {
    const root = await grid(beds);
    const cells = [...root.querySelectorAll('[part="cell"]')];
    expect(cells.map(c => c.getAttribute('data-tone'))).toEqual(['ok', 'ok', 'alarm', 'idle', null]);
    expect(cells[2].getAttribute('aria-label')).toBe('03 · 38.6 °C · Alarm');
    expect(cells[2].querySelector('.cell-value')?.textContent).toBe('38.6 °C');
    expect(root.querySelector('[part="grid"]')?.getAttribute('aria-label')).toBe('Ward 4B');
  });

  it('marks a cell’s emphasis, the second channel besides its colour', async () => {
    const root = await grid([{ label: '01', tone: 'ok' }, { label: '02', tone: 'alarm', emphasis: 'invert' }, { label: '03', tone: 'idle', emphasis: 'hatch' }, { label: '04', tone: 'warn', emphasis: 'nonsense' }]);
    const cells = [...root.querySelectorAll('[part="cell"]')];
    expect(cells.map(c => c.getAttribute('data-emphasis'))).toEqual([null, 'invert', 'hatch', null]);
  });

  it('counts the cells in each tone, in the tones’ order, when asked', async () => {
    const root = await grid(beds, { counts: true });
    expect([...root.querySelectorAll('[part="counts"] li')].map(l => l.textContent)).toEqual(['✓OK2', '✕Alarm1', '○Idle1']);
    expect((await grid(beds)).querySelector('[part="counts"]')).toBeNull();
  });

  it('takes a fixed number of columns and a cell shape it knows', async () => {
    let root = await grid(beds, { columns: 4, cell: 'dot' });
    const g = root.querySelector('[part="grid"]') as HTMLElement;
    expect(g.getAttribute('data-cell')).toBe('dot');
    expect(g.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(root.querySelector('.cell-label')).toBeNull();
    root = await grid(beds, { cell: 'hex' });
    expect(root.querySelector('[part="grid"]')?.getAttribute('data-cell')).toBe('square');
  });

  it('is what <u-widget> draws for a status-grid spec', async () => {
    const w = document.createElement('u-widget') as El;
    w.spec = { widget: 'status-grid', data: beds };
    document.body.appendChild(w);
    await w.updateComplete;
    expect(w.shadowRoot!.querySelector('uw-status-grid')).not.toBeNull();
  });
});
