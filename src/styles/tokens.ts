import { css } from 'lit';

/**
 * Shared CSS custom property tokens for all u-widget elements.
 *
 * Light mode values are the default fallbacks already used across components.
 * Dark mode values are applied via:
 *  1. `prefers-color-scheme: dark` media query (automatic)
 *  2. `:host([theme="dark"])` attribute (manual override)
 *
 * Host applications can override any `--u-widget-*` variable at any ancestor.
 */
export const themeStyles = css`
  @media (prefers-color-scheme: dark) {
    :host(:not([theme="light"])) {
      --u-widget-bg: #1e1e2e;
      --u-widget-surface: #2a2a3e;
      --u-widget-text: #e2e8f0;
      --u-widget-text-secondary: #94a3b8;
      --u-widget-border: #374151;
      --u-widget-primary: #818cf8;
    }
  }

  :host([theme="dark"]) {
    --u-widget-bg: #1e1e2e;
    --u-widget-surface: #2a2a3e;
    --u-widget-text: #e2e8f0;
    --u-widget-text-secondary: #94a3b8;
    --u-widget-border: #374151;
    --u-widget-primary: #818cf8;
  }
`;
