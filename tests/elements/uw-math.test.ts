import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let UwMath: typeof import('../../src/elements/uw-math.js').UwMath;

beforeEach(async () => {
  const mod = await import('../../src/elements/uw-math.js');
  UwMath = mod.UwMath;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new UwMath();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('uw-math', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UwMath();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.math-block')).toBeNull();
    });

    it('renders nothing when data is missing', () => {
      const el = render({ widget: 'math' });
      expect(shadow(el).querySelector('.math-block')).toBeNull();
    });

    it('renders nothing when expression is empty', () => {
      const el = render({ widget: 'math', data: { expression: '' } });
      expect(shadow(el).querySelector('.math-block')).toBeNull();
    });

    it('renders nothing when expression is whitespace-only', () => {
      const el = render({ widget: 'math', data: { expression: '   ' } });
      expect(shadow(el).querySelector('.math-block')).toBeNull();
    });

    it('coerces non-string expression to string', () => {
      const el = render({ widget: 'math', data: { expression: 42 } });
      const block = shadow(el).querySelector('.math-block');
      expect(block).toBeTruthy();
      expect(block?.innerHTML).toContain('42');
    });

    it('renders a simple expression', () => {
      const el = render({
        widget: 'math',
        data: { expression: 'E = mc^2' },
      });
      const block = shadow(el).querySelector('.math-block');
      expect(block).toBeTruthy();
      expect(block?.innerHTML).toContain('katex');
    });

    it('renders a LaTeX fraction', () => {
      const el = render({
        widget: 'math',
        data: { expression: '\\frac{a}{b}' },
      });
      const block = shadow(el).querySelector('.math-block');
      expect(block).toBeTruthy();
      expect(block?.innerHTML.length).toBeGreaterThan(0);
    });
  });

  describe('display mode', () => {
    it('defaults to inline mode (data-display="false")', () => {
      const el = render({
        widget: 'math',
        data: { expression: 'x^2' },
      });
      const block = shadow(el).querySelector('.math-block');
      expect(block?.getAttribute('data-display')).toBe('false');
    });

    it('sets display mode when option is true', () => {
      const el = render({
        widget: 'math',
        data: { expression: 'x^2' },
        options: { displayMode: true },
      });
      const block = shadow(el).querySelector('.math-block');
      expect(block?.getAttribute('data-display')).toBe('true');
    });
  });

  describe('error handling', () => {
    it('shows error for invalid LaTeX', () => {
      const el = render({
        widget: 'math',
        data: { expression: '\\invalid{' },
      });
      const error = shadow(el).querySelector('.math-error');
      expect(error).toBeTruthy();
    });

    it('shows the original expression in error', () => {
      const el = render({
        widget: 'math',
        data: { expression: '\\badcommand{' },
      });
      const code = shadow(el).querySelector('.math-error code');
      expect(code?.textContent).toBe('\\badcommand{');
    });
  });

  describe('CSS parts', () => {
    it('exposes math part on success', () => {
      const el = render({
        widget: 'math',
        data: { expression: 'x^2' },
      });
      expect(shadow(el).querySelector('[part="math"]')).toBeTruthy();
    });

    it('exposes math-error part on error', () => {
      const el = render({
        widget: 'math',
        data: { expression: '\\invalid{' },
      });
      expect(shadow(el).querySelector('[part="math-error"]')).toBeTruthy();
    });
  });
});
