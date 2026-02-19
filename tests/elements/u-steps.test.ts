import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let USteps: typeof import('../../src/elements/u-steps.js').USteps;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-steps.js');
  USteps = mod.USteps;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new USteps();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-steps', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new USteps();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.steps-vertical')).toBeNull();
      expect(shadow(el).querySelector('.steps-horizontal')).toBeNull();
    });

    it('renders nothing when data is empty', () => {
      const el = render({ widget: 'steps', data: [] as any });
      expect(shadow(el).querySelector('.steps-vertical')).toBeNull();
    });

    it('renders nothing when data is object (not array)', () => {
      const el = render({ widget: 'steps', data: { label: 'test' } });
      expect(shadow(el).querySelector('.steps-vertical')).toBeNull();
    });

    it('renders step items from array data', () => {
      const el = render({
        widget: 'steps',
        data: [
          { label: 'Step 1', status: 'done' },
          { label: 'Step 2', status: 'active' },
          { label: 'Step 3', status: 'pending' },
        ],
      });
      const items = shadow(el).querySelectorAll('.step-v');
      expect(items.length).toBe(3);
    });

    it('renders step labels', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'My Step', status: 'active' }],
      });
      const label = shadow(el).querySelector('.step-label');
      expect(label?.textContent?.trim()).toBe('My Step');
    });

    it('renders description text', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Step', status: 'active', description: 'Processing...' }],
      });
      const desc = shadow(el).querySelector('.step-desc');
      expect(desc?.textContent?.trim()).toBe('Processing...');
    });

    it('does not render description when absent', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Step', status: 'done' }],
      });
      expect(shadow(el).querySelector('.step-desc')).toBeNull();
    });
  });

  describe('status handling', () => {
    it('applies done status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Done', status: 'done' }],
      });
      const item = shadow(el).querySelector('.step-v');
      expect(item?.getAttribute('data-status')).toBe('done');
    });

    it('applies active status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Active', status: 'active' }],
      });
      const item = shadow(el).querySelector('.step-v');
      expect(item?.getAttribute('data-status')).toBe('active');
    });

    it('applies error status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Error', status: 'error' }],
      });
      const item = shadow(el).querySelector('.step-v');
      expect(item?.getAttribute('data-status')).toBe('error');
    });

    it('defaults to pending for missing status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'No Status' }],
      });
      const item = shadow(el).querySelector('.step-v');
      expect(item?.getAttribute('data-status')).toBe('pending');
    });

    it('defaults to pending for invalid status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Bad', status: 'bogus' }],
      });
      const item = shadow(el).querySelector('.step-v');
      expect(item?.getAttribute('data-status')).toBe('pending');
    });
  });

  describe('status icons', () => {
    it('renders SVG for done status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Done', status: 'done' }],
      });
      const icon = shadow(el).querySelector('.step-icon');
      expect(icon?.querySelector('svg')).toBeTruthy();
    });

    it('renders SVG for active status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Active', status: 'active' }],
      });
      const icon = shadow(el).querySelector('.step-icon');
      expect(icon?.querySelector('svg')).toBeTruthy();
    });

    it('renders SVG for pending status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Pending', status: 'pending' }],
      });
      const icon = shadow(el).querySelector('.step-icon');
      expect(icon?.querySelector('svg')).toBeTruthy();
    });

    it('renders SVG for error status', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Error', status: 'error' }],
      });
      const icon = shadow(el).querySelector('.step-icon');
      expect(icon?.querySelector('svg')).toBeTruthy();
    });

    it('renders custom icon override instead of SVG', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Custom', status: 'done', icon: '\u2705' }],
      });
      const icon = shadow(el).querySelector('.step-icon');
      expect(icon?.querySelector('.step-icon-text')).toBeTruthy();
      expect(icon?.querySelector('.step-icon-text')?.textContent).toBe('\u2705');
      expect(icon?.querySelector('svg')).toBeNull();
    });
  });

  describe('vertical layout', () => {
    it('renders vertical layout by default', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }, { label: 'B' }],
      });
      expect(shadow(el).querySelector('.steps-vertical')).toBeTruthy();
      expect(shadow(el).querySelector('.steps-horizontal')).toBeNull();
    });

    it('renders connector lines between steps', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
      });
      const lines = shadow(el).querySelectorAll('.step-line');
      expect(lines.length).toBe(3); // each step has a line div
    });
  });

  describe('horizontal layout', () => {
    it('renders horizontal layout when specified', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }, { label: 'B' }],
        options: { layout: 'horizontal' },
      });
      expect(shadow(el).querySelector('.steps-horizontal')).toBeTruthy();
      expect(shadow(el).querySelector('.steps-vertical')).toBeNull();
    });

    it('renders horizontal step items', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A', status: 'done' }, { label: 'B', status: 'active' }],
        options: { layout: 'horizontal' },
      });
      const items = shadow(el).querySelectorAll('.step-h');
      expect(items.length).toBe(2);
    });
  });

  describe('compact mode', () => {
    it('applies compact attribute', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A', description: 'Detail' }],
        options: { compact: true },
      });
      const list = shadow(el).querySelector('.steps-vertical');
      expect(list?.hasAttribute('data-compact')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has list role', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }],
      });
      expect(shadow(el).querySelector('[role="list"]')).toBeTruthy();
    });

    it('has listitem roles', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }, { label: 'B' }],
      });
      expect(shadow(el).querySelectorAll('[role="listitem"]').length).toBe(2);
    });

    it('uses title as aria-label', () => {
      const el = render({
        widget: 'steps',
        title: 'Progress',
        data: [{ label: 'A' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list?.getAttribute('aria-label')).toBe('Progress');
    });

    it('hides icons from screen readers', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }],
      });
      const icon = shadow(el).querySelector('.step-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('CSS parts', () => {
    it('exposes steps part', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }],
      });
      expect(shadow(el).querySelector('[part="steps"]')).toBeTruthy();
    });

    it('exposes step part', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }],
      });
      expect(shadow(el).querySelector('[part="step"]')).toBeTruthy();
    });

    it('exposes step-icon part', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }],
      });
      expect(shadow(el).querySelector('[part="step-icon"]')).toBeTruthy();
    });

    it('exposes step-label part', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'A' }],
      });
      expect(shadow(el).querySelector('[part="step-label"]')).toBeTruthy();
    });
  });

  describe('data filtering', () => {
    it('skips items without label', () => {
      const el = render({
        widget: 'steps',
        data: [{ label: 'Valid' }, { status: 'done' }],
      });
      const items = shadow(el).querySelectorAll('.step-v');
      expect(items.length).toBe(1);
    });
  });
});
