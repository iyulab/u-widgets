import { describe, it, expect } from 'vitest';
import { themeStyles } from '../../src/styles/tokens.js';

describe('themeStyles', () => {
  const cssText = themeStyles.cssText;

  describe('light mode tokens', () => {
    it('defines background token', () => {
      expect(cssText).toContain('--u-widget-bg:');
    });

    it('defines surface token', () => {
      expect(cssText).toContain('--u-widget-surface:');
    });

    it('defines text tokens', () => {
      expect(cssText).toContain('--u-widget-text:');
      expect(cssText).toContain('--u-widget-text-secondary:');
    });

    it('defines border token', () => {
      expect(cssText).toContain('--u-widget-border:');
    });

    it('defines primary color token', () => {
      expect(cssText).toContain('--u-widget-primary:');
    });

    it('defines semantic color tokens', () => {
      expect(cssText).toContain('--u-widget-positive:');
      expect(cssText).toContain('--u-widget-negative:');
      expect(cssText).toContain('--u-widget-warning:');
    });

    it('defines spacing tokens', () => {
      expect(cssText).toContain('--u-widget-gap:');
      expect(cssText).toContain('--u-widget-radius:');
    });

    it('defines typography tokens', () => {
      expect(cssText).toContain('--u-widget-font-family:');
      expect(cssText).toContain('--u-widget-font-size:');
    });

    it('defines chart height token', () => {
      expect(cssText).toContain('--u-widget-chart-height:');
    });

    it('defines shadow tokens', () => {
      expect(cssText).toContain('--u-widget-shadow:');
      expect(cssText).toContain('--u-widget-shadow-hover:');
    });
  });

  describe('dark mode', () => {
    it('includes prefers-color-scheme dark media query', () => {
      expect(cssText).toContain('prefers-color-scheme');
    });

    it('excludes theme="light" from auto dark mode', () => {
      expect(cssText).toContain(':not([theme="light"])');
    });

    it('includes manual theme="dark" selector', () => {
      expect(cssText).toContain('[theme="dark"]');
    });
  });

  describe('element themeStyles inclusion', () => {
    const elementNames = [
      'u-widget',
      'u-chart',
      'u-metric',
      'u-gauge',
      'u-table',
      'u-form',
      'u-content',
      'u-compose',
    ];

    for (const name of elementNames) {
      it(`${name} includes themeStyles in static styles`, { timeout: 15000 }, async () => {
        // Import elements to register them (u-chart is a separate entry point)
        await import('../../src/elements/u-widget.js');
        if (name === 'u-chart') {
          await import('../../src/elements/u-chart.js');
        }
        const ctor = customElements.get(name) as any;
        expect(ctor).toBeDefined();

        const styles = ctor.styles;
        const allCss = Array.isArray(styles)
          ? styles.map((s: any) => s.cssText ?? '').join(' ')
          : styles?.cssText ?? '';

        // Every element should have the shared theme tokens
        expect(allCss).toContain('--u-widget-bg:');
        expect(allCss).toContain('--u-widget-text:');
        expect(allCss).toContain('--u-widget-primary:');
      });
    }
  });
});
