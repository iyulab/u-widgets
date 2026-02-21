import { describe, it, expect } from 'vitest';
import { themeStyles } from '../../src/styles/tokens.js';

// WCAG 2.1 relative luminance
function relativeLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)!
    .map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

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

describe('WCAG AA color contrast (minimum 4.5:1)', () => {
  describe('light theme defaults', () => {
    it('primary text on white bg', () => {
      expect(contrastRatio('#1a1a2e', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text on white bg', () => {
      const ratio = contrastRatio('#64748b', '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('dark theme', () => {
    const bg = '#1e1e2e';
    const surface = '#2a2a3e';

    it('primary text on dark bg', () => {
      expect(contrastRatio('#e2e8f0', bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text on dark bg', () => {
      const ratio = contrastRatio('#94a3b8', bg);
      console.log(`text-secondary on dark bg: ${ratio.toFixed(2)}:1`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text on surface', () => {
      const ratio = contrastRatio('#94a3b8', surface);
      console.log(`text-secondary on surface: ${ratio.toFixed(2)}:1`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('positive color on dark bg', () => {
      expect(contrastRatio('#4ade80', bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('negative color on dark bg', () => {
      expect(contrastRatio('#f87171', bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('warning color on dark bg', () => {
      expect(contrastRatio('#fbbf24', bg)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
