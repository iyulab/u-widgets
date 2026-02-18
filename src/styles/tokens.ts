import { css } from 'lit';

/**
 * Shared CSS custom property tokens for all u-widget elements.
 *
 * **Token categories:**
 * - Colors: bg, surface, text, text-secondary, border, primary, negative, danger
 * - Spacing: gap, radius
 * - Typography: font-family, font-size
 * - Chart: chart-height, chart-color-1..10
 *
 * **Theme modes:**
 * 1. Light mode: `:host` defaults (always applied)
 * 2. Dark mode via `prefers-color-scheme: dark` (automatic, unless `theme="light"`)
 * 3. Dark mode via `theme="dark"` attribute (manual override)
 *
 * Host applications can override any `--u-widget-*` variable at any ancestor.
 */
export const themeStyles = css`
  :host {
    /* ── Colors (light) ── */
    --u-widget-bg: #ffffff;
    --u-widget-surface: #f1f5f9;
    --u-widget-text: #1a1a2e;
    --u-widget-text-secondary: #64748b;
    --u-widget-border: #e2e8f0;
    --u-widget-primary: #4f46e5;
    --u-widget-negative: #dc2626;
    --u-widget-danger: #ef4444;
    --u-widget-success: #22c55e;
    --u-widget-warning: #f59e0b;

    /* ── Spacing ── */
    --u-widget-gap: 16px;
    --u-widget-radius: 6px;

    /* ── Typography ── */
    --u-widget-font-family: system-ui, -apple-system, sans-serif;
    --u-widget-font-size: 0.875rem;

    /* ── Chart ── */
    --u-widget-chart-height: 300px;
  }

  @media (prefers-color-scheme: dark) {
    :host(:not([theme="light"])) {
      --u-widget-bg: #1e1e2e;
      --u-widget-surface: #2a2a3e;
      --u-widget-text: #e2e8f0;
      --u-widget-text-secondary: #94a3b8;
      --u-widget-border: #374151;
      --u-widget-primary: #818cf8;
      --u-widget-negative: #f87171;
      --u-widget-danger: #f87171;
      --u-widget-success: #4ade80;
      --u-widget-warning: #fbbf24;
    }
  }

  :host([theme="dark"]) {
    --u-widget-bg: #1e1e2e;
    --u-widget-surface: #2a2a3e;
    --u-widget-text: #e2e8f0;
    --u-widget-text-secondary: #94a3b8;
    --u-widget-border: #374151;
    --u-widget-primary: #818cf8;
    --u-widget-negative: #f87171;
    --u-widget-danger: #f87171;
    --u-widget-success: #4ade80;
    --u-widget-warning: #fbbf24;
  }
`;
