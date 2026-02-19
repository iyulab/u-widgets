import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

type StatusLevel = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface StatusItem {
  label: string;
  value: string;
  level: StatusLevel;
}

const VALID_LEVELS = new Set(['info', 'success', 'warning', 'error', 'neutral']);

/** Level → indicator symbol. */
const LEVEL_ICONS: Record<StatusLevel, string> = {
  info: '\u25CF',     // ●
  success: '\u2713',  // ✓
  warning: '\u25B2',  // ▲
  error: '\u2715',    // ✕
  neutral: '\u25CB',  // ○
};

/**
 * <u-status> — Status indicator widget.
 *
 * Renders one or more status items with label, value, and level-based coloring.
 * Single item or array of items.
 */
@customElement('u-status')
export class UStatus extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-status / inline-size;
    }

    .status-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
    }

    .status-icon {
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .status-label {
      color: var(--u-widget-text-secondary, #64748b);
      font-weight: 500;
    }

    .status-label::after {
      content: ':';
    }

    .status-value {
      font-weight: 600;
    }

    /* Level colors */
    [data-level="info"] .status-icon,
    [data-level="info"] .status-value {
      color: var(--u-widget-primary, #3b82f6);
    }
    [data-level="success"] .status-icon,
    [data-level="success"] .status-value {
      color: var(--u-widget-positive, #16a34a);
    }
    [data-level="warning"] .status-icon,
    [data-level="warning"] .status-value {
      color: var(--u-widget-warning, #f59e0b);
    }
    [data-level="error"] .status-icon,
    [data-level="error"] .status-value {
      color: var(--u-widget-negative, #dc2626);
    }
    [data-level="neutral"] .status-icon,
    [data-level="neutral"] .status-value {
      color: var(--u-widget-text-secondary, #64748b);
    }

    @container u-status (max-width: 20rem) {
      .status-list { gap: 8px 16px; }
      .status-item { font-size: 0.8125rem; }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    if (!this.spec) return nothing;

    const items = this._extractItems();
    if (items.length === 0) return nothing;

    return html`
      <div class="status-list" part="status" role="list" aria-label=${this.spec.title ?? 'Status'}>
        ${items.map(item => html`
          <div class="status-item" part="status-item" role="listitem" data-level=${item.level}>
            <span class="status-icon" part="status-icon" aria-hidden="true">${LEVEL_ICONS[item.level]}</span>
            <span class="status-label" part="status-label">${item.label}</span>
            <span class="status-value" part="status-value">${item.value}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _extractItems(): StatusItem[] {
    const data = this.spec?.data;
    if (!data) return [];

    // Array of status items
    if (Array.isArray(data)) {
      return data.filter((item): item is Record<string, unknown> =>
        item != null && typeof item === 'object' && 'label' in item && 'value' in item,
      ).map(item => ({
        label: String(item.label),
        value: String(item.value),
        level: this._resolveLevel(item.level),
      }));
    }

    // Single status item
    if (typeof data === 'object' && 'label' in data && 'value' in data) {
      const d = data as Record<string, unknown>;
      return [{
        label: String(d.label),
        value: String(d.value),
        level: this._resolveLevel(d.level),
      }];
    }

    return [];
  }

  private _resolveLevel(level: unknown): StatusLevel {
    const s = String(level ?? 'info');
    return VALID_LEVELS.has(s) ? s as StatusLevel : 'info';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-status': UStatus;
  }
}
