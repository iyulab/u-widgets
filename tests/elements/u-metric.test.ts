import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/u-metric.js';
import type { UMetric } from '../../src/elements/u-metric.js';

function createElement(spec: Record<string, unknown>): UMetric {
  const el = document.createElement('u-metric') as UMetric;
  el.spec = spec as UMetric['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UMetric) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-metric', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
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

    it('renders description when provided', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Users', value: 1200, description: 'Active in last 30 days' },
        ],
      });
      const shadow = await render(el);
      const desc = shadow.querySelector('.metric-description');
      expect(desc).not.toBeNull();
      expect(desc?.textContent).toBe('Active in last 30 days');
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

    it('hides description when not provided', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: 'Users', value: 1200 },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.metric-description')).toBeNull();
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
    it('metric: variant "danger" sets data-variant attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: '23.5%', label: '이탈률', variant: 'danger' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-variant')).toBe('danger');
    });

    it('metric: variant "success" sets data-variant attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: '67%', label: '재구매율', variant: 'success' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-variant')).toBe('success');
    });

    it('metric: variant "warning" sets data-variant attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 3, label: '재고 부족', variant: 'warning' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.getAttribute('data-variant')).toBe('warning');
    });

    it('metric: no variant sets no data-variant attribute', async () => {
      const el = createElement({
        widget: 'metric',
        data: { value: 42, label: 'Normal' },
      });
      const shadow = await render(el);
      const metricEl = shadow.querySelector('.metric');
      expect(metricEl?.hasAttribute('data-variant')).toBe(false);
    });

    it('stat-group: each item can have independent variant', async () => {
      const el = createElement({
        widget: 'stat-group',
        data: [
          { label: '재구매율', value: '67%', variant: 'success' },
          { label: '이탈률', value: '23.5%', variant: 'danger' },
          { label: '총 주문', value: 320 },
        ],
      });
      const shadow = await render(el);
      const metrics = shadow.querySelectorAll('.metric');
      expect(metrics[0]?.getAttribute('data-variant')).toBe('success');
      expect(metrics[1]?.getAttribute('data-variant')).toBe('danger');
      expect(metrics[2]?.hasAttribute('data-variant')).toBe(false);
    });

    it('CSS: variant classes exist in styles', () => {
      const styles = (customElements.get('u-metric') as any).styles;
      const cssText = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(cssText).toContain('data-variant');
      expect(cssText).toContain('success');
      expect(cssText).toContain('danger');
    });
  });

  describe('container query', () => {
    it('has container-type declared in styles', () => {
      const styles = (customElements.get('u-metric') as any).styles;
      const cssText = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(cssText).toContain('container');
      expect(cssText).toContain('u-metric');
    });
  });
});
