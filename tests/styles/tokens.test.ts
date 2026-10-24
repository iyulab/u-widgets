import { describe, it, expect, vi } from 'vitest';
import { themeStyles } from '../../src/styles/tokens.js';

// uw-chart's static styles are read below, never a chart drawn: echarts stands in as stubs, as in uw-chart.test.ts.
// Loading the real one made this file's first uw-chart import run past its timeout under a full suite's load.
vi.mock('echarts/core', () => ({ default: { use: vi.fn(), init: vi.fn() }, use: vi.fn(), init: vi.fn() }));
vi.mock('echarts/charts', () => ({
  BarChart: {}, LineChart: {}, PieChart: {}, ScatterChart: {}, RadarChart: {},
  HeatmapChart: {}, BoxplotChart: {}, FunnelChart: {}, TreemapChart: {}, CustomChart: {},
}));
vi.mock('echarts/components', () => ({
  GridComponent: {}, TooltipComponent: {}, LegendComponent: {}, RadarComponent: {}, MarkLineComponent: {}, VisualMapComponent: {},
}));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {} }));

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
    });

    it('defines spacing tokens', () => {
      expect(cssText).toContain('--u-widget-gap:');
      expect(cssText).toContain('--u-widget-radius:');
    });

    it('defines typography tokens', () => {
      expect(cssText).toContain('--u-widget-font-family:');
      expect(cssText).toContain('--u-widget-font-mono:');
      expect(cssText).toContain('--u-widget-font-size:');
    });

    it('defines a typography scale (label/caption/overline tiers, rem-based)', () => {
      expect(cssText).toMatch(/--u-widget-font-size-label:\s*0\.8125rem/);
      expect(cssText).toMatch(/--u-widget-font-size-caption:\s*0\.75rem/);
      expect(cssText).toMatch(/--u-widget-font-size-overline:\s*0\.6875rem/);
      // body tier reuses the existing --u-widget-font-size token (0.875rem) — no new token for it.
    });

    it('defines chart height token', () => {
      expect(cssText).toContain('--u-widget-chart-height:');
    });

    it('defines shadow tokens', () => {
      expect(cssText).toContain('--u-widget-shadow:');
      // 호버 그림자 토큰은 없다 — 위젯 카드는 상호작용 요소가 아니라 호버로 떠오르지 않는다(읽는 곳 없이 정의만 있었다).
      expect(cssText).not.toContain('--u-widget-shadow-hover');
    });

    it('defines chart color palette tokens', () => {
      for (let i = 1; i <= 8; i++) {
        expect(cssText).toContain(`--u-widget-chart-color-${i}:`);
      }
    });
  });

  describe('dark mode', () => {
    it('uses color-scheme for automatic dark/light adaptation', () => {
      expect(cssText).toContain('color-scheme:');
      expect(cssText).toContain('light dark');
    });

    it('uses @media prefers-color-scheme for dark mode', () => {
      expect(cssText).toContain('prefers-color-scheme: dark');
    });

    it('includes manual theme="dark" selector', () => {
      expect(cssText).toContain('[theme="dark"]');
    });

    it('includes manual theme="light" selector', () => {
      expect(cssText).toContain('[theme="light"]');
    });
  });

  describe('element themeStyles inclusion', () => {
    const elementNames = [
      'u-widget',
      'uw-chart',
      'uw-metric',
      'uw-gauge',
      'uw-table',
      'uw-form',
      'uw-content',
      'uw-compose',
    ];

    for (const name of elementNames) {
      it(`${name} includes themeStyles in static styles`, async () => {
        // Import elements to register them (u-chart is a separate entry point)
        await import('../../src/elements/u-widget.js');
        if (name === 'uw-chart') {
          await import('../../src/elements/uw-chart.js');
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

describe('tone contrast — a tone is read as text and as a mark', () => {
  /** The declarations of the block `selector` opens, as written. */
  function declared(selector: string): Record<string, string> {
    const css = themeStyles.cssText;
    const start = css.indexOf(`${selector} {`);
    const body = css.slice(start + selector.length + 2, css.indexOf('}', start));
    return Object.fromEntries([...body.matchAll(/(--u-widget-[\w-]+):\s*([^;]+);/g)].map(m => [m[1]!, m[2]!.trim()]));
  }
  /** Every token of a theme with each `var()` resolved within it, in the form the contrast check reads (`#ffffff`). */
  function resolved(all: Record<string, string>): Record<string, string> {
    const resolve = (value: string): string => {
      const ref = /^var\((--u-widget-[\w-]+)\)$/.exec(value);
      return ref ? resolve(all[ref[1]!]!) : value;
    };
    const long = (v: string) => (/^#[0-9a-f]{3}$/i.test(v) ? `#${[...v.slice(1)].map(c => c + c).join('')}` : v);
    return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, long(resolve(v))]));
  }
  /** `hex` laid at `alpha` over `under` — a badge's tint of its tone. */
  const over = (hex: string, alpha: number, under: string) => {
    const c = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
    return `#${[0, 1, 2].map(i => Math.round(c(hex, i) * alpha + c(under, i) * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`;
  };
  // A dark theme declares only what it changes; the rest is the light declaration, resolved against the dark values.
  const light = declared(':host(:not([nested]))');
  const themes = { light: resolved(light), dark: resolved({ ...light, ...declared(':host([theme="dark"]:not([nested]))') }) };
  const TONES = ['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'accent'] as const;

  for (const [theme, t] of Object.entries(themes)) {
    for (const tone of TONES) {
      it(`${theme} ${tone}: 4.5:1 on the page, 3:1 on its own badge`, () => {
        const ink = t[`--u-widget-tone-${tone}`]!;
        const bg = t['--u-widget-bg']!;
        expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
        // A status badge is a 14% tint of its tone (uw-status-card): its glyph and word are drawn in the tone on it.
        for (const page of [bg, t['--u-widget-surface']!]) expect(contrastRatio(ink, over(ink, 0.14, page))).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

