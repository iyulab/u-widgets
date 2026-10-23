import { describe, it, expect, vi, afterEach } from 'vitest';
import '../../src/elements/uw-header.js';

type El = HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
async function header(data: unknown, options?: Record<string, unknown>) {
  const el = document.createElement('uw-header') as El;
  el.spec = { widget: 'header', data, options: { locale: 'en-US', ...options } };
  document.body.appendChild(el);
  await el.updateComplete;
  return { el, root: el.shadowRoot! };
}

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); });

describe('uw-header', () => {
  it('draws the heading at its level with a kicker above and a subtitle under it', async () => {
    const { root } = await header({ text: 'Harbour cranes', level: 1, kicker: 'Port of Incheon', subtitle: 'Berths 3–7' });
    const h = root.querySelector('[role="heading"]')!;
    expect([h.textContent, h.getAttribute('aria-level')]).toEqual(['Harbour cranes', '1']);
    expect(root.querySelector('[part="kicker"]')?.textContent).toBe('Port of Incheon');
    expect(root.querySelector('[part="subtitle"]')?.textContent).toBe('Berths 3–7');
  });

  it('shows the date and the time of day it is for, the side values formatted, and the state as a badge', async () => {
    const { root } = await header({
      text: 'Kitchen', date: '2026-10-23', time: '2026-10-23T18:45:00', tone: 'warn',
      aside: [{ label: 'Open', value: 14 }, { label: 'Late', value: 3, tone: 'alarm' }, { label: 'Avg', value: 11.26, format: 'number:1', unit: 'min' }],
    });
    expect(root.querySelector('[part="date"]')?.textContent).toMatch(/2026/);
    expect(root.querySelector('[part="time"]')?.textContent).toMatch(/6:45|18:45/);
    expect([...root.querySelectorAll('.aside dd')].map(d => d.textContent)).toEqual(['14', '3', '11.3 min']);
    expect(root.querySelector('[part="status"]')?.textContent).toBe('▲Warning');
  });

  it('runs a clock while asked for, and stops it when taken off the page', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 23, 9, 5));
    const { el, root } = await header({ text: 'Ops', clock: true }, { locale: 'en-GB' });
    expect(root.querySelector('[part="time"]')?.textContent).toBe('09:05');
    vi.setSystemTime(new Date(2026, 9, 23, 9, 6));
    vi.advanceTimersByTime(15_000);
    await el.updateComplete;
    expect(root.querySelector('[part="time"]')?.textContent).toBe('09:06');
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('draws nothing without a heading', async () => {
    const { root } = await header({ kicker: 'only' });
    expect(root.querySelector('[part="header-block"]')).toBeNull();
  });
});
