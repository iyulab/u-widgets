import { css } from 'lit';

/**
 * Shared CSS custom property tokens for all u-widget elements.
 *
 * **Token categories:**
 * - Colors: bg, surface, text, text-secondary, border, primary, positive, negative, warning
 * - Spacing: gap, radius
 * - Typography: font-family, font-size
 * - Chart: chart-height, chart-color-1..10
 *
 * **Theme modes:**
 * Uses `@media (prefers-color-scheme)` + `[theme]` attribute for dark/light adaptation.
 * 1. Auto mode: `:host` declares `color-scheme: light dark` — inherits from parent
 *    or falls back to `prefers-color-scheme` media query.
 * 2. Manual override: `theme="dark"` or `theme="light"` forces `color-scheme`.
 *
 * Note: `light-dark()` CSS function is NOT used for color tokens because
 * `getComputedStyle().getPropertyValue()` returns the raw function string
 * instead of the resolved color — breaking imperative consumers like ECharts.
 *
 * Host applications can override any `--u-widget-*` variable by styling the
 * element directly (e.g., `u-widget { --u-widget-text: blue; }`).
 */
export const themeStyles = css`
  :host {
    color-scheme: light dark;

    /* ── Colors (light defaults) ── */
    --u-widget-bg: #fff;
    --u-widget-surface: #f1f5f9;
    --u-widget-text: #1a1a2e;
    --u-widget-text-secondary: #64748b;
    --u-widget-border: #e2e8f0;
    --u-widget-primary: #4f46e5;
    --u-widget-positive: #16a34a;
    --u-widget-negative: #dc2626;
    --u-widget-warning: #d97706;

    /* ── Chart palette (light) ── */
    --u-widget-chart-color-1: #4f46e5;
    --u-widget-chart-color-2: #0ea5e9;
    --u-widget-chart-color-3: #10b981;
    --u-widget-chart-color-4: #f59e0b;
    --u-widget-chart-color-5: #ef4444;
    --u-widget-chart-color-6: #8b5cf6;
    --u-widget-chart-color-7: #ec4899;
    --u-widget-chart-color-8: #06b6d4;

    /* ── Spacing ── */
    --u-widget-gap: 16px;
    --u-widget-radius: 6px;

    /* ── Typography ── */
    --u-widget-font-family: system-ui, -apple-system, sans-serif;
    --u-widget-font-size: 0.875rem;

    /* ── Chart ── */
    --u-widget-chart-height: 300px;

    /* ── Shadow ── */
    --u-widget-shadow:
      0 1px 3px rgba(0,0,0,0.08),
      0 1px 2px rgba(0,0,0,0.06);
    --u-widget-shadow-hover:
      0 4px 12px rgba(0,0,0,0.10),
      0 2px 4px rgba(0,0,0,0.06);
  }

  /* ── Dark mode (auto via prefers-color-scheme) ── */
  @media (prefers-color-scheme: dark) {
    :host(:not([theme="light"])) {
      --u-widget-bg: #1e1e2e;
      --u-widget-surface: #2a2a3e;
      --u-widget-text: #e2e8f0;
      --u-widget-text-secondary: #94a3b8;
      --u-widget-border: #374151;
      --u-widget-primary: #818cf8;
      --u-widget-positive: #4ade80;
      --u-widget-negative: #f87171;
      --u-widget-warning: #fbbf24;

      --u-widget-chart-color-1: #818cf8;
      --u-widget-chart-color-2: #38bdf8;
      --u-widget-chart-color-3: #34d399;
      --u-widget-chart-color-4: #fbbf24;
      --u-widget-chart-color-5: #f87171;
      --u-widget-chart-color-6: #a78bfa;
      --u-widget-chart-color-7: #f472b6;
      --u-widget-chart-color-8: #22d3ee;

      --u-widget-shadow:
        0 1px 3px rgba(0,0,0,0.3),
        0 1px 2px rgba(0,0,0,0.2);
      --u-widget-shadow-hover:
        0 4px 12px rgba(0,0,0,0.4),
        0 2px 4px rgba(0,0,0,0.2);
    }
  }

  /* ── Dark mode (manual via theme attribute) ── */
  :host([theme="dark"]) {
    color-scheme: dark;
    --u-widget-bg: #1e1e2e;
    --u-widget-surface: #2a2a3e;
    --u-widget-text: #e2e8f0;
    --u-widget-text-secondary: #94a3b8;
    --u-widget-border: #374151;
    --u-widget-primary: #818cf8;
    --u-widget-positive: #4ade80;
    --u-widget-negative: #f87171;
    --u-widget-warning: #fbbf24;

    --u-widget-chart-color-1: #818cf8;
    --u-widget-chart-color-2: #38bdf8;
    --u-widget-chart-color-3: #34d399;
    --u-widget-chart-color-4: #fbbf24;
    --u-widget-chart-color-5: #f87171;
    --u-widget-chart-color-6: #a78bfa;
    --u-widget-chart-color-7: #f472b6;
    --u-widget-chart-color-8: #22d3ee;

    --u-widget-shadow:
      0 1px 3px rgba(0,0,0,0.3),
      0 1px 2px rgba(0,0,0,0.2);
    --u-widget-shadow-hover:
      0 4px 12px rgba(0,0,0,0.4),
      0 2px 4px rgba(0,0,0,0.2);
  }

  :host([theme="light"]) {
    color-scheme: light;
  }
`;
