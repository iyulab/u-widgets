import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let UStatus: typeof import('../../src/elements/u-status.js').UStatus;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-status.js');
  UStatus = mod.UStatus;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new UStatus();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-status', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UStatus();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.status-list')).toBeNull();
    });

    it('renders nothing when data is empty', () => {
      const el = render({ widget: 'status', data: {} });
      expect(shadow(el).querySelector('.status-list')).toBeNull();
    });

    it('renders status items from array data', () => {
      const el = render({
        widget: 'status',
        data: [
          { label: 'API', value: 'Up', level: 'success' },
          { label: 'DB', value: 'Down', level: 'error' },
        ],
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(2);
    });

    it('renders single status from object data', () => {
      const el = render({
        widget: 'status',
        data: { label: 'Service', value: 'Running', level: 'success' },
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(1);
    });

    it('renders label text', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'API Gateway', value: 'OK', level: 'success' }],
      });
      const label = shadow(el).querySelector('.status-label');
      expect(label?.textContent?.trim()).toBe('API Gateway');
    });

    it('renders value text', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'API', value: 'Operational', level: 'success' }],
      });
      const value = shadow(el).querySelector('.status-value');
      expect(value?.textContent?.trim()).toBe('Operational');
    });
  });

  describe('level handling', () => {
    it('applies info level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Info', level: 'info' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('info');
    });

    it('applies success level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', level: 'success' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('success');
    });

    it('applies warning level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Slow', level: 'warning' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('warning');
    });

    it('applies error level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Down', level: 'error' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('error');
    });

    it('applies neutral level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'N/A', level: 'neutral' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('neutral');
    });

    it('defaults to info for missing level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Val' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('info');
    });

    it('defaults to info for unknown level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Val', level: 'bogus' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-level')).toBe('info');
    });
  });

  describe('level icons', () => {
    it('renders icon for each item', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', level: 'success' }],
      });
      const icon = shadow(el).querySelector('.status-icon');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders success checkmark symbol', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', level: 'success' }],
      });
      const icon = shadow(el).querySelector('.status-icon');
      expect(icon?.textContent).toBe('\u2713'); // ✓
    });

    it('renders error cross symbol', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Down', level: 'error' }],
      });
      const icon = shadow(el).querySelector('.status-icon');
      expect(icon?.textContent).toBe('\u2715'); // ✕
    });
  });

  describe('accessibility', () => {
    it('has list role', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list).toBeTruthy();
    });

    it('has listitem roles', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'A', value: '1' }, { label: 'B', value: '2' }],
      });
      const items = shadow(el).querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(2);
    });

    it('uses title as aria-label', () => {
      const el = render({
        widget: 'status',
        title: 'System Health',
        data: [{ label: 'API', value: 'OK' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list?.getAttribute('aria-label')).toBe('System Health');
    });
  });

  describe('CSS parts', () => {
    it('exposes status part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status"]')).toBeTruthy();
    });

    it('exposes status-item part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-item"]')).toBeTruthy();
    });

    it('exposes status-icon part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-icon"]')).toBeTruthy();
    });

    it('exposes status-label part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-label"]')).toBeTruthy();
    });

    it('exposes status-value part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-value"]')).toBeTruthy();
    });
  });

  describe('data filtering', () => {
    it('skips items without label', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Valid', value: 'OK' }, { value: 'No Label' }],
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(1);
    });

    it('skips items without value', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Valid', value: 'OK' }, { label: 'No Value' }],
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(1);
    });
  });
});
