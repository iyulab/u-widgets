import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let URating: typeof import('../../src/elements/u-rating.js').URating;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-rating.js');
  URating = mod.URating;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new URating();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-rating', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new URating();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.rating')).toBeNull();
    });

    it('renders rating display', () => {
      const el = render({
        widget: 'rating',
        data: { value: 4 },
      });
      expect(shadow(el).querySelector('.rating')).toBeTruthy();
    });

    it('renders 5 icons by default', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
      });
      const icons = shadow(el).querySelectorAll('.rating-icon');
      expect(icons.length).toBe(5);
    });

    it('renders custom max icons', () => {
      const el = render({
        widget: 'rating',
        data: { value: 2 },
        options: { max: 10 },
      });
      const icons = shadow(el).querySelectorAll('.rating-icon');
      expect(icons.length).toBe(10);
    });

    it('renders value display for non-interactive', () => {
      const el = render({
        widget: 'rating',
        data: { value: 4.2 },
      });
      const value = shadow(el).querySelector('.rating-value');
      expect(value?.textContent?.trim()).toBe('4.2');
    });

    it('does not render value when zero', () => {
      const el = render({
        widget: 'rating',
        data: { value: 0 },
      });
      expect(shadow(el).querySelector('.rating-value')).toBeNull();
    });

    it('renders count when provided', () => {
      const el = render({
        widget: 'rating',
        data: { value: 4.5, count: 128 },
      });
      const count = shadow(el).querySelector('.rating-count');
      expect(count?.textContent).toContain('128');
    });
  });

  describe('icon states', () => {
    it('shows full icons for rated positions', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
      });
      const icons = shadow(el).querySelectorAll('.rating-icon');
      expect(icons[0].getAttribute('data-state')).toBe('full');
      expect(icons[1].getAttribute('data-state')).toBe('full');
      expect(icons[2].getAttribute('data-state')).toBe('full');
      expect(icons[3].getAttribute('data-state')).toBe('empty');
      expect(icons[4].getAttribute('data-state')).toBe('empty');
    });

    it('shows half icon for fractional value', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3.5 },
      });
      const icons = shadow(el).querySelectorAll('.rating-icon');
      expect(icons[2].getAttribute('data-state')).toBe('full');
      expect(icons[3].getAttribute('data-state')).toBe('half');
      expect(icons[4].getAttribute('data-state')).toBe('empty');
    });

    it('rounds to full for values near integer', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3.1 },
      });
      const icons = shadow(el).querySelectorAll('.rating-icon');
      // 3.1 → 4th icon: 0.1 < 0.25, so empty
      expect(icons[3].getAttribute('data-state')).toBe('empty');
    });
  });

  describe('icon types', () => {
    it('defaults to star icon', () => {
      const el = render({
        widget: 'rating',
        data: { value: 1 },
      });
      const icon = shadow(el).querySelector('.rating-icon');
      expect(icon?.getAttribute('data-icon')).toBe('star');
    });

    it('supports heart icon', () => {
      const el = render({
        widget: 'rating',
        data: { value: 1 },
        options: { icon: 'heart' },
      });
      const icon = shadow(el).querySelector('.rating-icon');
      expect(icon?.getAttribute('data-icon')).toBe('heart');
    });

    it('supports thumb icon', () => {
      const el = render({
        widget: 'rating',
        data: { value: 1 },
        options: { icon: 'thumb' },
      });
      const icon = shadow(el).querySelector('.rating-icon');
      expect(icon?.getAttribute('data-icon')).toBe('thumb');
    });

    it('falls back to star for unknown icon', () => {
      const el = render({
        widget: 'rating',
        data: { value: 1 },
        options: { icon: 'unknown' },
      });
      const icon = shadow(el).querySelector('.rating-icon');
      expect(icon?.getAttribute('data-icon')).toBe('star');
    });
  });

  describe('interactive mode', () => {
    it('marks icons as interactive', () => {
      const el = render({
        widget: 'rating',
        options: { interactive: true },
      });
      const icon = shadow(el).querySelector('.rating-icon');
      expect(icon?.hasAttribute('data-interactive')).toBe(true);
    });

    it('has radio role when interactive', () => {
      const el = render({
        widget: 'rating',
        options: { interactive: true },
      });
      const icon = shadow(el).querySelector('.rating-icon');
      expect(icon?.getAttribute('role')).toBe('radio');
    });

    it('has radiogroup role on container when interactive', () => {
      const el = render({
        widget: 'rating',
        options: { interactive: true },
      });
      const rating = shadow(el).querySelector('.rating');
      expect(rating?.getAttribute('role')).toBe('radiogroup');
    });

    it('does not show value display when interactive', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
        options: { interactive: true },
      });
      expect(shadow(el).querySelector('.rating-value')).toBeNull();
    });
  });

  describe('label', () => {
    it('renders label when specified', () => {
      const el = render({
        widget: 'rating',
        options: { interactive: true, label: 'Rate this:' },
      });
      const label = shadow(el).querySelector('.rating-label');
      expect(label?.textContent?.trim()).toBe('Rate this:');
    });

    it('does not render label when not specified', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
      });
      expect(shadow(el).querySelector('.rating-label')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has img role for display mode', () => {
      const el = render({
        widget: 'rating',
        data: { value: 4 },
      });
      const rating = shadow(el).querySelector('.rating');
      expect(rating?.getAttribute('role')).toBe('img');
    });

    it('has aria-label with rating info', () => {
      const el = render({
        widget: 'rating',
        data: { value: 4.2 },
      });
      const rating = shadow(el).querySelector('.rating');
      expect(rating?.getAttribute('aria-label')).toContain('4.2');
    });
  });

  describe('CSS parts', () => {
    it('exposes rating part', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
      });
      expect(shadow(el).querySelector('[part="rating"]')).toBeTruthy();
    });

    it('exposes rating-icons part', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
      });
      expect(shadow(el).querySelector('[part="rating-icons"]')).toBeTruthy();
    });

    it('exposes rating-value part', () => {
      const el = render({
        widget: 'rating',
        data: { value: 3 },
      });
      expect(shadow(el).querySelector('[part="rating-value"]')).toBeTruthy();
    });
  });
});
