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
