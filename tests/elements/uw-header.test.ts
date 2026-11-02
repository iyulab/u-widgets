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

  it('marks its badge with the glyph it is given, in place of its tone’s', async () => {
    const { root } = await header({ text: 'Kitchen', tone: 'warn', status: 'Busy', glyph: '!' });
    expect(root.querySelector('[part="status"]')?.textContent).toBe('!Busy');
    expect(root.querySelector('[part="status"]')?.getAttribute('data-tone')).toBe('warn');
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

  it('says how long ago a time was in the locale\'s words, refreshed while on the page, and stops when taken off it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T09:00:20Z'));
    const { el, root } = await header({ text: 'Ops', since: '2026-10-23T09:00:00Z' });
    const since = () => root.querySelector('[part="since"]')?.textContent;
    expect(since()).toBe('now');
    vi.setSystemTime(new Date('2026-10-23T09:03:10Z'));
    vi.advanceTimersByTime(15_000);
    await el.updateComplete;
    expect(since()).toBe('3 minutes ago');
    vi.setSystemTime(new Date('2026-10-23T11:30:00Z'));
    vi.advanceTimersByTime(15_000);
    await el.updateComplete;
    expect(since()).toBe('2 hours ago');
    vi.setSystemTime(new Date('2026-10-25T09:00:00Z'));
    vi.advanceTimersByTime(15_000);
    await el.updateComplete;
    expect(since()).toBe('2 days ago');
    expect(root.querySelector('[part="since"]')?.getAttribute('aria-live')).toBe('off');
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reads a time ahead of the viewer\'s clock as now, a text that is no time as nothing, and a locale in its own words', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T09:00:00Z'));
    expect((await header({ text: 'A', since: '2026-10-23T09:00:40Z' })).root.querySelector('[part="since"]')?.textContent).toBe('now');
    expect((await header({ text: 'B', since: 'yesterday-ish' })).root.querySelector('[part="since"]')).toBeNull();
    const korean = await header({ text: 'C', since: '2026-10-23T08:56:00Z' }, { locale: 'ko-KR' });
    expect(korean.root.querySelector('[part="since"]')?.textContent).toBe('4분 전');
  });

  it('shows a date and a time that carry an offset on the clock of options.timeZone, and leaves a wall clock as written', async () => {
    const shown = async (data: Record<string, unknown>, timeZone?: string) =>
      (await header({ text: 'Plant', ...data }, { locale: 'en-GB', ...(timeZone ? { timeZone } : {}) })).root;
    // 05:10 UTC is 14:10 in Seoul — the source's clock, not the viewer's
    expect((await shown({ time: '2026-10-23T05:10:00Z' }, 'Asia/Seoul')).querySelector('[part="time"]')?.textContent).toBe('14:10');
    expect((await shown({ time: '2026-10-23T05:10:00Z' }, 'UTC')).querySelector('[part="time"]')?.textContent).toBe('05:10');
    // the date follows the zone across midnight
    expect((await shown({ date: '2026-10-22T20:00:00Z' }, 'Asia/Seoul')).querySelector('[part="date"]')?.textContent).toBe('23/10/2026');
    // a time written without an offset is a wall clock where it was made: no zone moves it
    expect((await shown({ time: '2026-10-23T14:10:00' }, 'America/New_York')).querySelector('[part="time"]')?.textContent).toBe('14:10');
    // a name that is no zone changes nothing and breaks nothing
    expect((await shown({ time: '2026-10-23T14:10:00+09:00' }, 'Mars/Base')).querySelector('[part="time"]')?.textContent).toMatch(/\d\d:\d\d/);
  });

  it('draws nothing without a heading', async () => {
    const { root } = await header({ kicker: 'only' });
    expect(root.querySelector('[part="header-block"]')).toBeNull();
  });
});

describe('uw-header: what a host may set', () => {
    // jsdom does not lay out, so what the host's tokens do is read from the stylesheet the element is drawn with
    const styles = (customElements.get('uw-header') as unknown as { styles: unknown }).styles;
    const css = [styles].flat(Infinity).map(x => (x as { cssText?: string }).cssText ?? '').join(' ');

  it('draws the heading at its level times --u-widget-title-scale, unscaled when unset', () => {
    for (const size of ['1.5rem', '1.25rem', '1.1rem']) expect(css).toContain(`calc(${size} * var(--u-widget-title-scale, 1))`);
    expect(css).not.toMatch(/\.header-widget\[data-level='\d'\]\s*\{\s*font-size:\s*\d/);
  });

  it('takes the colour of the kicker from --u-widget-kicker-color, the secondary text colour when unset', () => {
    expect(css).toContain('color: var(--u-widget-kicker-color, var(--u-widget-text-secondary, #5b6777))');
  });
});
