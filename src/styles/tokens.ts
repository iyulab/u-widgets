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
 * Uses CSS `color-scheme` + `light-dark()` for automatic dark/light adaptation.
 * 1. Auto mode: `:host` declares `color-scheme: light dark` — inherits from parent
 *    or falls back to `prefers-color-scheme`.
 * 2. Manual override: `theme="dark"` or `theme="light"` forces `color-scheme`.
 *
 * Host applications can override any `--u-widget-*` variable by styling the
 * element directly (e.g., `u-widget { --u-widget-text: blue; }`).
 */
export const themeStyles = css`
  :host {
    color-scheme: light dark;

    /* ── Colors ── */
    --u-widget-bg: light-dark(#fff, #1e1e2e);
    --u-widget-surface: light-dark(#f1f5f9, #2a2a3e);
    --u-widget-text: light-dark(#1a1a2e, #e2e8f0);
    --u-widget-text-secondary: light-dark(#64748b, #94a3b8);
    --u-widget-border: light-dark(#e2e8f0, #374151);
    --u-widget-primary: light-dark(#4f46e5, #818cf8);
    --u-widget-positive: light-dark(#16a34a, #4ade80);
    --u-widget-negative: light-dark(#dc2626, #f87171);
    --u-widget-warning: light-dark(#d97706, #fbbf24);

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
      0 1px 3px light-dark(rgba(0,0,0,0.08), rgba(0,0,0,0.3)),
      0 1px 2px light-dark(rgba(0,0,0,0.06), rgba(0,0,0,0.2));
    --u-widget-shadow-hover:
      0 4px 12px light-dark(rgba(0,0,0,0.10), rgba(0,0,0,0.4)),
      0 2px 4px light-dark(rgba(0,0,0,0.06), rgba(0,0,0,0.2));
  }

  :host([theme="dark"]) {
    color-scheme: dark;
  }

  :host([theme="light"]) {
    color-scheme: light;
  }
`;
