import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/uw-metric.js';
import type { UwMetric } from '../../src/elements/uw-metric.js';

function createElement(spec: Record<string, unknown>): UwMetric {
  const el = document.createElement('uw-metric') as UwMetric;
  el.spec = spec as unknown as UwMetric['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UwMetric) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('uw-metric', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('meter', () => {
    it('draws a bar against the range, in the value tone unless it has its own', async () => {
      const shadow = await render(createElement({
        widget: 'metric',
        data: { label: 'Bore', value: 1240, unit: 'm', tone: 'now', meter: { value: 1240, max: 2000, unit: 'm', format: 'number' } },
      }));
      const meter = shadow.querySelector('.meter')!;
      expect(meter.getAttribute('role')).toBe('meter');
      expect(meter.getAttribute('data-form')).toBe('bar');
      expect(meter.getAttribute('data-tone')).toBe('now');
      expect(meter.getAttribute('aria-label')).toBe('Bore');
      expect(meter.getAttribute('aria-valuetext')).toBe('1,240 m');
      expect((shadow.querySelector('.meter-fill') as HTMLElement).style.width).toBe('62.0%');
      // The figure is already the value above — the meter does not write it again.
      expect(shadow.querySelector('.meter-text')).toBeNull();
    });

    it('writes a meter value that is not the figure beside it', async () => {
      const shadow = await render(createElement({
        widget: 'metric',
        data: { label: 'Rings', value: 412, meter: { value: 62, unit: '%' } },
      }));
      expect(shadow.querySelector('.meter-text')?.textContent).toBe('62 %');
    });

    it('draws a ring with form: "ring"', async () => {
      const shadow = await render(createElement({
        widget: 'metric',
        data: { value: 82, unit: '%', meter: { value: 82, form: 'ring', tone: 'ok' } },
      }));
      const meter = shadow.querySelector('.meter')!;
      expect(meter.getAttribute('data-form')).toBe('ring');
      expect(meter.getAttribute('data-tone')).toBe('ok');
      expect(shadow.querySelector('.meter-ring-fill')?.getAttribute('stroke-dasharray')).toBe('82.0 100');
      expect(shadow.querySelector('.meter-track')).toBeNull();
    });

    it('draws no meter for a value outside any range', async () => {
      for (const meter of [{ value: 'x' }, { value: 5, min: 10, max: 10 }, {}, 'full']) {
        const shadow = await render(createElement({ widget: 'metric', data: { value: 1, meter } }));
        expect(shadow.querySelector('.meter')).toBeNull();
      }
    });

    it('gives each stat-group item its own meter', async () => {
      const shadow = await render(createElement({
        widget: 'stat-group',
        data: [{ label: 'A', value: 1, meter: { value: 25 } }, { label: 'B', value: 2 }, { label: 'C', value: 3, meter: { value: 3, max: 4, form: 'ring' } }],
      }));
      expect([...shadow.querySelectorAll('.meter')].map(m => m.getAttribute('data-form'))).toEqual(['bar', 'ring']);
    });
  });

  describe('metric widget', () => {
    it('renders value', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42 },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('42');
    });

    it('renders value with unit', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 1284, unit: 'EA' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('1284');
      expect(valueEl?.textContent).toContain('EA');
    });

    it('renders prefix', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 84000, prefix: '$' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('$');
      expect(valueEl?.textContent).toContain('84000');
    });

    it('renders suffix', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 73, suffix: '%' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('73');
      expect(valueEl?.textContent).toContain('%');
    });

    it('renders change with up trend', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, change: 12.5, trend: 'up' },
      });
      const shadow = await render(el);
      const changeEl = shadow.querySelector('.metric-change');
      expect(changeEl?.textContent).toContain('+12.5%');
      expect(changeEl?.getAttribute('data-trend')).toBe('up');
    });

    it('renders change with down trend', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, change: -2.1, trend: 'down' },
      });
      const shadow = await render(el);
      const changeEl = shadow.querySelector('.metric-change');
      expect(changeEl?.textContent).toContain('-2.1%');
      expect(changeEl?.getAttribute('data-trend')).toBe('down');
    });

    it('renders label', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, label: 'Users' },
      });
      const shadow = await render(el);
      const labelEl = shadow.querySelector('.metric-label');
      expect(labelEl?.textContent).toBe('Users');
    });

    it('renders string value', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 'Healthy', label: 'System Status' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('Healthy');
      const labelEl = shadow.querySelector('.metric-label');
      expect(labelEl?.textContent).toBe('System Status');
    });

    it('renders string value with unit', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 'v2.4.1', unit: 'release', label: 'Version' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('v2.4.1');
      expect(valueEl?.textContent).toContain('release');
    });

    it('hides label when not provided', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42 },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.metric-label')).toBeNull();
    });

    it('draws the recent values as a line under the value, scaled to their own range', async () => {
      const el = createElement({ widget: 'metric', data: { value: 18.4, sparkline: [10, 20, 'x', 15], tone: 'alarm' } });
      const shadow = await render(el);
      const line = shadow.querySelector('.metric-sparkline .line');
      // Three numbers across the width: the lowest at the bottom margin, the highest at the top one.
      expect(line?.getAttribute('d')).toBe('M0,22L50,2L100,12');
      expect(shadow.querySelector('.metric-sparkline')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('draws a flat run in the middle, and no line for fewer than two values', async () => {
      const flat = await render(createElement({ widget: 'metric', data: { value: 1, sparkline: [3, 3] } }));
      expect(flat.querySelector('.metric-sparkline .line')?.getAttribute('d')).toBe('M0,12L100,12');
      const one = await render(createElement({ widget: 'metric', data: { value: 1, sparkline: [3] } }));
      expect(one.querySelector('.metric-sparkline')).toBeNull();
    });

    it('renders nothing when no data', async () => {
      const el = createElement({ widget: 'metric' });
      const shadow = await render(el);
      expect(shadow.querySelector('.metric')).toBeNull();
    });
  });

  describe('stat-group widget', () => {
    it('renders multiple metrics', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Users', value: 1200, change: 5.2, trend: 'up' },
          { label: 'Revenue', value: 84000, prefix: '$', change: -2.1, trend: 'down' },
          { label: 'Orders', value: 320, change: 0, trend: 'flat' },
        ],
      });
      const shadow = await render(el);
      const metrics = shadow.querySelectorAll('.metric');
      expect(metrics.length).toBe(3);
    });

    it('renders each stat with correct value', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ],
      });
      const shadow = await render(el);
      const labels = shadow.querySelectorAll('.metric-label');
      expect(labels[0]?.textContent).toBe('A');
      expect(labels[1]?.textContent).toBe('B');
    });

    it('renders in flex row layout', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.stat-group')).not.toBeNull();
    });

    it('wraps stat-group in clip container for row-leading dividers', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ],
      });
      const shadow = await render(el);
      // 구분선 클립 기법: .stat-group-clip > .stat-group 구조 유지가 전제
      expect(shadow.querySelector('.stat-group-clip > .stat-group')).not.toBeNull();
    });

    it('CSS: cells never shrink below content (overlap regression)', () => {
      // 셀이 값보다 좁아지면
      // nowrap 값이 이웃 셀 위로 겹쳐 그려진다. min-width가 콘텐츠 기반이어야 함.
      const styles = (customElements.get('uw-metric') as any).styles;
      const cssText = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(cssText).toContain('min-width: min(100%, max-content)');
      expect(cssText).not.toContain('min-width: 100px');
    });

    it('renders icon when provided', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Revenue', value: 42000, icon: '\uD83D\uDCB0' },
        ],
      });
      const shadow = await render(el);
      const icon = shadow.querySelector('.metric-icon');
      expect(icon).not.toBeNull();
      expect(icon?.textContent).toContain('\uD83D\uDCB0');
    });

    it('renders a note under the value', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Users', value: 1200, note: 'Active in last 30 days' },
        ],
      });
      const shadow = await render(el);
      const note = shadow.querySelector('.metric-note');
      expect(note).not.toBeNull();
      expect(note?.textContent).toBe('Active in last 30 days');
    });

    it('does not read the old description field', async () => {
      const el = createElement({ widget: 'stat-group', data: [{ label: 'Users', value: 1200, description: 'Old' }] });
      const shadow = await render(el);
      expect(shadow.textContent).not.toContain('Old');
    });

    it('hides icon when not provided', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Users', value: 1200 },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.metric-icon')).toBeNull();
    });

    it('hides the note when not provided', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Users', value: 1200 },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.metric-note')).toBeNull();
    });
  });

  describe('format field', () => {
    it('metric: format "percent" appends % to numeric value', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 73, label: 'Rate', format: 'percent' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('73');
      expect(valueEl?.textContent).toContain('%');
    });

    it('metric: format "number" formats with locale separator', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 1234567, label: 'Total', format: 'number' },
        options: { locale: 'en-US' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      // formatted: "1,234,567" — not raw "1234567"
      expect(valueEl?.textContent).toContain('1,234,567');
    });

    it('metric: no format renders raw value unchanged', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 1234567, label: 'Raw' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('1234567');
    });

    it('stat-group: format "percent" applied per item', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Repeat Rate', value: 67.3, format: 'percent' },
          { label: 'Churn Rate', value: 5.1, format: 'percent' },
        ],
      });
      const shadow = await render(el);
      const values = shadow.querySelectorAll('.metric-value');
      expect(values[0]?.textContent).toContain('%');
      expect(values[1]?.textContent).toContain('%');
    });

    it('stat-group: mixed format and no-format items', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Revenue', value: 1000000, format: 'number', options: { locale: 'en-US' } },
          { label: 'Orders', value: 320 },
        ],
      });
      const shadow = await render(el);
      const values = shadow.querySelectorAll('.metric-value');
      // Second item (no format) should show raw value
      expect(values[1]?.textContent).toContain('320');
    });

    it('stat-group: locale from spec.options propagated to format', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [{ label: 'Rate', value: 42, format: 'percent' }],
        options: { locale: 'en-US' },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.metric-value');
      expect(valueEl?.textContent).toContain('42');
      expect(valueEl?.textContent).toContain('%');
    });
  });

  describe('variant field', () => {
    it('metric: variant "danger" sets data-tone attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: '23.5%', label: '이탈률', tone: 'alarm' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-tone')).toBe('alarm');
    });

    it('metric: variant "success" sets data-tone attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: '67%', label: '재구매율', tone: 'ok' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-tone')).toBe('ok');
    });

    it('metric: variant "warning" sets data-tone attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 3, label: '재고 부족', tone: 'warn' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-tone')).toBe('warn');
    });

    it('metric: no variant sets no data-tone attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, label: 'Normal' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.hasAttribute('data-tone')).toBe(false);
    });

    it('stat-group: each item can have independent variant', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: '재구매율', value: '67%', tone: 'ok' },
          { label: '이탈률', value: '23.5%', tone: 'alarm' },
          { label: '총 주문', value: 320 },
        ],
      });
      const shadow = await render(el);
      const metrics = shadow.querySelectorAll('.metric');
      expect(metrics[0]?.getAttribute('data-tone')).toBe('ok');
      expect(metrics[1]?.getAttribute('data-tone')).toBe('alarm');
      expect(metrics[2]?.hasAttribute('data-tone')).toBe(false);
    });

    it('metric: variant "info" sets data-tone attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, label: 'Info', tone: 'info' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-tone')).toBe('info');
    });

    it('metric: variant "neutral" sets data-tone attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, label: 'Neutral', tone: 'idle' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-tone')).toBe('idle');
    });

    it('CSS: the tone rules are in the styles', () => {
      const styles = (customElements.get('uw-metric') as any).styles;
      const cssText = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(cssText).toContain('data-tone');
    });
  });

  describe('container query', () => {
    it('has container-type declared in styles', () => {
      const styles = (customElements.get('uw-metric') as any).styles;
      const cssText = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(cssText).toContain('container');
      expect(cssText).toContain('uw-metric');
    });
  });

  describe('polarity · target', () => {
    const change = async (data: Record<string, unknown>) =>
      (await render(createElement({ widget: 'metric', data: { value: 3.2, change: 0.4, ...data } }))).querySelector('.metric-change')!;

    it('without polarity a rise is good news and a fall bad — the look before polarity existed', async () => {
      expect((await change({ trend: 'up' })).getAttribute('data-sense')).toBe('good');
      expect((await change({ trend: 'down' })).getAttribute('data-sense')).toBe('bad');
      expect((await change({ trend: 'flat' })).getAttribute('data-sense')).toBe('neutral');
      expect((await change({})).getAttribute('data-sense')).toBe('neutral');
    });

    it('lower-better turns a rise into bad news — the arrow still points up', async () => {
      const el = await change({ trend: 'up', polarity: 'lower-better' });
      expect(el.getAttribute('data-sense')).toBe('bad');
      expect(el.textContent).toContain('↑');
      expect((await change({ trend: 'down', polarity: 'lower-better' })).getAttribute('data-sense')).toBe('good');
    });

    it('neutral shows the direction without judging it', async () => {
      expect((await change({ trend: 'up', polarity: 'neutral' })).getAttribute('data-sense')).toBe('neutral');
      expect((await change({ trend: 'down', polarity: 'neutral' })).getAttribute('data-sense')).toBe('neutral');
    });

    it('an unknown polarity warns once and reads as none', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect((await change({ trend: 'up', polarity: 'smaller' })).getAttribute('data-sense')).toBe('good');
      await change({ trend: 'up', polarity: 'smaller' });
      expect(warn.mock.calls.filter(([m]) => String(m).includes('polarity "smaller"'))).toHaveLength(1);
      warn.mockRestore();
    });

    it('writes the change in its unit — % unless given', async () => {
      expect((await change({ trend: 'up' })).textContent).toContain('+0.4%');
      expect((await change({ trend: 'up', changeUnit: 'pt' })).textContent).toContain('+0.4pt');
      expect((await change({ trend: 'up', changeUnit: '' })).textContent?.trim()).toMatch(/\+0\.4$/);
    });

    it('writes the target like the value, under it', async () => {
      const shadow = await render(createElement({
        widget: 'metric',
        data: { label: 'Defect rate', value: 3.2, unit: '%', target: 2.5, polarity: 'lower-better' },
      }));
      expect(shadow.querySelector('[part="target"]')?.textContent).toBe('Target 2.5 %');
      const formatted = await render(createElement({
        widget: 'metric', options: { format: 'number:1' }, data: { value: 1240, target: 1500 },
      }));
      expect(formatted.querySelector('[part="target"]')?.textContent).toBe('Target 1,500.0');
    });

    it('draws no target line without a target', async () => {
      const shadow = await render(createElement({ widget: 'metric', data: { value: 1 } }));
      expect(shadow.querySelector('[part="target"]')).toBeNull();
    });
  });

  describe('meter target (bullet)', () => {
    it('marks the target across the bar and writes it into what is announced', async () => {
      const shadow = await render(createElement({
        widget: 'metric',
        data: { label: 'OEE', value: 72, unit: '%', meter: { value: 72, unit: '%', target: 85 } },
      }));
      const mark = shadow.querySelector('.meter-target') as HTMLElement;
      expect(mark.style.left).toBe('85.0%');
      // The unit stands after a no-break space, as the metric writes it.
      expect(shadow.querySelector('.meter')!.getAttribute('aria-valuetext')).toBe('72 %, Target 85 %');
    });

    it('a meter of the figure itself takes the metric target — another meter does not', async () => {
      const own = await render(createElement({ widget: 'metric', data: { value: 72, target: 85, meter: { value: 72 } } }));
      expect((own.querySelector('.meter-target') as HTMLElement).style.left).toBe('85.0%');
      const other = await render(createElement({ widget: 'metric', data: { value: 412, target: 500, meter: { value: 62 } } }));
      expect(other.querySelector('.meter-target')).toBeNull();
    });

    it('a ring draws no mark, and a meter without a target has none', async () => {
      const ring = await render(createElement({ widget: 'metric', data: { value: 72, meter: { value: 72, form: 'ring', target: 85 } } }));
      expect(ring.querySelector('.meter-target')).toBeNull();
      const plain = await render(createElement({ widget: 'metric', data: { value: 72, meter: { value: 72 } } }));
      expect(plain.querySelector('.meter-target')).toBeNull();
      expect(plain.querySelector('.meter')!.getAttribute('aria-valuetext')).toBe('72');
    });
  });
});
