import { describe, it, expect, vi, afterEach } from 'vitest';
import '../../src/elements/uw-status-card.js';
import '../../src/elements/u-widget.js';
import { registerLocale } from '../../src/core/locale.js';
import { ko } from '../../src/locales/ko.js';

type El = HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
async function card(data: unknown, options?: Record<string, unknown>) {
  const el = document.createElement('uw-status-card') as El;
  el.spec = { widget: 'status-card', data, ...(options && { options }) };
  document.body.appendChild(el);
  await el.updateComplete;
  return el.shadowRoot!;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('uw-status-card', () => {
  it('draws the name, the state as a toned badge with its mark, and the readings formatted with their units', async () => {
    const root = await card({
      title: 'Pump P-3', subtitle: 'Intake', tone: 'warn', status: 'Vibration high',
      readings: [{ label: 'Flow', value: 412.46, format: 'number:1', unit: 'm³/h' }, { label: 'Vib', value: 7.2, tone: 'alarm' }],
    }, { locale: 'en-US' });
    const c = root.querySelector('.card')!;
    expect(c.getAttribute('data-tone')).toBe('warn');
    expect(c.getAttribute('aria-label')).toBe('Pump P-3: Vibration high');
    expect(root.querySelector('[part="title"]')?.textContent).toBe('Pump P-3');
    expect(root.querySelector('[part="badge"]')?.textContent).toBe('▲Vibration high');
    const readings = [...root.querySelectorAll('.reading')];
    expect(readings.map(r => r.querySelector('dd')?.textContent)).toEqual(['412.5 m³/h', '7.2']);
    expect(readings[1].getAttribute('data-tone')).toBe('alarm');
  });

  it('names the state with the tone’s name in the widget’s locale when it has no words of its own', async () => {
    registerLocale('ko', ko);
    const root = await card({ title: '펌프', tone: 'alarm' }, { locale: 'ko' });
    expect(root.querySelector('[part="badge"]')?.textContent).toBe('✕경보');
  });

  it('marks the badge with the glyph it is given, in place of the tone’s', async () => {
    const root = await card({ title: 'Line 2', tone: 'warn', status: 'Delayed', glyph: '!' }, { locale: 'en-US' });
    expect(root.querySelector('[part="badge"]')?.textContent).toBe('!Delayed');
    expect(root.querySelector('.card')!.getAttribute('data-tone')).toBe('warn');
  });

  it('draws a meter against its range, kept within the bar', async () => {
    const root = await card({ title: 'Tank', meter: { value: 150, min: 0, max: 120, unit: 'L' } });
    expect((root.querySelector('.meter-fill') as HTMLElement).style.width).toBe('100.0%');
    const meter = root.querySelector('[role="meter"]')!;
    // The range is the meter's own; the value it reports stays inside it, the written value says the rest.
    expect([meter.getAttribute('aria-valuemin'), meter.getAttribute('aria-valuemax'), meter.getAttribute('aria-valuenow')]).toEqual(['0', '120', '120']);
    expect(meter.getAttribute('aria-valuetext')).toBe(root.querySelector('.meter-text')?.textContent);
    expect(root.querySelector('.meter-text')?.textContent).toBe('150 L');
  });

  it('shows a picture from an image or an icon, and refuses a script address', async () => {
    let root = await card({ title: 'Light', image: 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E' });
    expect(root.querySelector('[part="picture"] img')).not.toBeNull();
    root = await card({ title: 'Light', image: 'javascript:alert(1)', icon: '🗼' });
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('[part="picture"]')?.textContent).toBe('🗼');
  });

  it('stamps the state instead of a badge when its emphasis is stamp', async () => {
    const root = await card({ title: 'Order 12', tone: 'past', status: 'Served', emphasis: 'stamp' });
    expect(root.querySelector('[part="stamp"]')?.textContent).toBe('Served');
    expect(root.querySelector('.card')?.getAttribute('data-emphasis')).toBe('stamp');
  });

  it('draws nothing without a title, and takes only the overflow policies it knows', async () => {
    expect((await card({ tone: 'ok' })).querySelector('.card')).toBeNull();
    expect((await card({ title: 'A' }, { overflow: 'fade' })).querySelector('.card')?.getAttribute('data-overflow')).toBe('fade');
    expect((await card({ title: 'A' }, { overflow: 'wrap' })).querySelector('.card')?.getAttribute('data-overflow')).toBe('clip');
  });

  it('is what <u-widget> draws for a status-card spec', async () => {
    const w = document.createElement('u-widget') as El;
    w.spec = { widget: 'status-card', data: { title: 'Gate 4', tone: 'ok' } };
    document.body.appendChild(w);
    await w.updateComplete;
    expect(w.shadowRoot!.querySelector('uw-status-card')).not.toBeNull();
  });

  it('warns once for a tone it does not know', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await card({ title: 'A', tone: 'red' });
    expect(warn.mock.calls.some(c => String(c[0]).includes('uw-status-card: unknown tone "red"'))).toBe(true);
    warn.mockRestore();
  });
});
