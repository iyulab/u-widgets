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
 * 1. Light mode: No `:host` color defaults — each `var()` call has a light fallback.
 *    This allows host applications to set `--u-widget-*` on any ancestor and have
 *    the values inherited naturally through Shadow DOM.
 * 2. Dark mode via `prefers-color-scheme: dark` (automatic, unless `theme="light"`)
 * 3. Dark mode via `theme="dark"` attribute (manual override)
 *
 * Host applications can override any `--u-widget-*` variable at any ancestor.
 * Colors inherit automatically — no need to set `theme` attribute just for theming.
 * The `theme="dark"` attribute is still useful for component-specific overrides
 * (e.g., code syntax highlight colors).
 */
export const themeStyles = css`
  :host {
    /* ── Spacing ── */
    --u-widget-gap: 16px;
    --u-widget-radius: 6px;

    /* ── Typography ── */
    --u-widget-font-family: system-ui, -apple-system, sans-serif;
    --u-widget-font-size: 0.875rem;

    /* ── Chart ── */
    --u-widget-chart-height: 300px;

    /* ── Shadow ── */
    --u-widget-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    --u-widget-shadow-hover: 0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
  }

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
      --u-widget-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
      --u-widget-shadow-hover: 0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2);
    }
  }

  :host([theme="dark"]) {
    --u-widget-bg: #1e1e2e;
    --u-widget-surface: #2a2a3e;
    --u-widget-text: #e2e8f0;
    --u-widget-text-secondary: #94a3b8;
    --u-widget-border: #374151;
    --u-widget-primary: #818cf8;
    --u-widget-positive: #4ade80;
    --u-widget-negative: #f87171;
    --u-widget-warning: #fbbf24;
    --u-widget-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
    --u-widget-shadow-hover: 0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2);
  }
`;
