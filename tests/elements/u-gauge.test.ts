import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/u-gauge.js';
import type { UGauge } from '../../src/elements/u-gauge.js';

function createElement(spec: Record<string, unknown>): UGauge {
  const el = document.createElement('u-gauge') as UGauge;
  el.spec = spec as UGauge['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UGauge) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-gauge', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('gauge widget', () => {
    it('renders gauge container with SVG', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 73 },
        options: { min: 0, max: 100, unit: '%' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.gauge-container')).not.toBeNull();
      expect(shadow.querySelector('svg')).not.toBeNull();
    });

    it('displays value as HTML overlay', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 73 },
        options: { min: 0, max: 100 },
      });
      const shadow = await render(el);
      const valueEl = shadow.querySelector('.gauge-value');
      expect(valueEl?.textContent).toBe('73');
    });

    it('displays unit', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 42 },
        options: { min: 0, max: 100, unit: '%' },
      });
      const shadow = await render(el);
      const unit = shadow.querySelector('.gauge-unit');
      expect(unit?.textContent).toBe('%');
    });

    it('hides unit when not specified', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 42 },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.gauge-unit')).toBeNull();
    });

    it('renders track path', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 73 },
        options: { min: 0, max: 100 },
      });
      const shadow = await render(el);
      const track = shadow.querySelector('.gauge-track');
      expect(track).not.toBeNull();
      expect(track?.getAttribute('d')).toContain('M');
    });

    it('renders fill path with threshold color', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 73 },
        options: {
          min: 0,
          max: 100,
          thresholds: [
            { to: 60, color: 'green' },
            { to: 80, color: 'yellow' },
            { to: 100, color: 'red' },
          ],
        },
      });
      const shadow = await render(el);
      const fill = shadow.querySelector('.gauge-fill');
      expect(fill).not.toBeNull();
      expect(fill?.getAttribute('stroke')).toBe('#eab308');
    });

    it('uses red for high value', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 95 },
        options: {
          min: 0,
          max: 100,
          thresholds: [
            { to: 60, color: 'green' },
            { to: 80, color: 'yellow' },
            { to: 100, color: 'red' },
          ],
        },
      });
      const shadow = await render(el);
      const fill = shadow.querySelector('.gauge-fill');
      expect(fill?.getAttribute('stroke')).toBe('#dc2626');
    });

    it('handles zero value (fill path has stroke="none")', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 0 },
        options: { min: 0, max: 100 },
      });
      const shadow = await render(el);
      const fill = shadow.querySelector('.gauge-fill');
      expect(fill).not.toBeNull();
      expect(fill?.getAttribute('stroke')).toBe('none');
      expect(shadow.querySelector('.gauge-track')).not.toBeNull();
    });

    it('renders nothing when no data', async () => {
      const el = createElement({ widget: 'gauge' });
      const shadow = await render(el);
      expect(shadow.querySelector('.gauge-container')).toBeNull();
    });

    it('has role="meter" with ARIA attributes', async () => {
      const el = createElement({
        widget: 'gauge',
        title: 'CPU Usage',
        data: { value: 73 },
        options: { min: 0, max: 100, unit: '%' },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.gauge-container');
      expect(container?.getAttribute('role')).toBe('meter');
      expect(container?.getAttribute('aria-valuenow')).toBe('73');
      expect(container?.getAttribute('aria-valuemin')).toBe('0');
      expect(container?.getAttribute('aria-valuemax')).toBe('100');
      expect(container?.getAttribute('aria-label')).toBe('CPU Usage');
      expect(container?.getAttribute('aria-valuetext')).toBe('73%');
    });

    it('hides SVG from screen readers', async () => {
      const el = createElement({
        widget: 'gauge',
        data: { value: 50 },
        options: { min: 0, max: 100 },
      });
      const shadow = await render(el);
      const svg = shadow.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('role')).toBe('presentation');
    });
  });

  describe('progress widget', () => {
    it('renders progress bar', async () => {
      const el = createElement({
        widget: 'progress',
        data: { value: 65, max: 100 },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.progress-bar-track')).not.toBeNull();
    });

    it('renders correct percentage width', async () => {
      const el = createElement({
        widget: 'progress',
        data: { value: 65, max: 100 },
      });
      const shadow = await render(el);
      const fill = shadow.querySelector('.progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('65%');
    });

    it('shows value and percentage', async () => {
      const el = createElement({
        widget: 'progress',
        data: { value: 65, max: 100 },
      });
      const shadow = await render(el);
      const info = shadow.querySelector('.progress-info');
      expect(info?.textContent).toContain('65');
    });

    it('supports custom label with {value} template', async () => {
      const el = createElement({
        widget: 'progress',
        data: { value: 65, max: 100 },
        options: { label: '{value}%' },
      });
      const shadow = await render(el);
      const info = shadow.querySelector('.progress-info');
      expect(info?.textContent).toContain('65%');
    });

    it('clamps percentage to 0-100', async () => {
      const el = createElement({
        widget: 'progress',
        data: { value: 150, max: 100 },
      });
      const shadow = await render(el);
      const fill = shadow.querySelector('.progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('100%');
    });

    it('applies threshold color to progress fill', async () => {
      const el = createElement({
        widget: 'progress',
        data: { value: 90, max: 100 },
        options: {
          thresholds: [
            { to: 50, color: 'green' },
            { to: 80, color: 'yellow' },
            { to: 100, color: 'red' },
          ],
        },
      });
      const shadow = await render(el);
      const fill = shadow.querySelector('.progress-bar-fill') as HTMLElement;
      expect(fill.style.background).toBe('#dc2626');
    });

    it('has role="progressbar" with ARIA attributes', async () => {
      const el = createElement({
        widget: 'progress',
        title: 'Upload',
        data: { value: 65, max: 100 },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.progress-container');
      expect(container?.getAttribute('role')).toBe('progressbar');
      expect(container?.getAttribute('aria-valuenow')).toBe('65');
      expect(container?.getAttribute('aria-valuemin')).toBe('0');
      expect(container?.getAttribute('aria-valuemax')).toBe('100');
      expect(container?.getAttribute('aria-label')).toBe('Upload');
    });
  });

  describe('container query', () => {
    it('declares container: u-gauge / inline-size on :host', () => {
      const styles = (customElements.get('u-gauge') as unknown as { styles: { cssText: string } }).styles;
      const text = typeof styles === 'string' ? styles : Array.isArray(styles) ? styles.map((s: { cssText: string }) => s.cssText).join('') : styles.cssText;
      expect(text).toContain('container:');
      expect(text).toContain('u-gauge');
      expect(text).toContain('inline-size');
    });
  });
});
