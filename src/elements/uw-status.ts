import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';

type StatusLevel = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface StatusItem {
  /** Absent for a badge that shows the value alone ("● Running"). */
  label?: string;
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
 * <uw-status> — Status indicator widget.
 *
 * Renders one or more status items with label, value, and level-based coloring.
 * Single item or array of items.
 */
@customElement('uw-status')
export class UwStatus extends LitElement {
  static styles = [themeStyles, css`
    /* 세로 flex 인 이유: 아래 렌더 루트가 flex item 이어야 호스트 제약이 그것에 닿는다.
       안쪽 status-list 의 가로 wrap 설계와는 다른 축이다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-status / inline-size;
    }

    /* ⚠flex-wrap 은 «가로» 축 설계라 그대로 둔다 — 여기서 여는 것은 «세로» 축뿐이다.
       항목이 여러 행으로 감기면서 길어진 높이가 호스트 제약을 넘던 자리다. */
    .status-list {
      display: flex;
      flex-wrap: wrap;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      gap: 12px 24px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--u-widget-font-size, 0.875rem);
    }

    .status-icon {
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      flex-shrink: 0;
    }

    .status-label {
      color: var(--u-widget-text-secondary, #5b6777);
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
      color: var(--u-widget-primary, #4f46e5);
    }
    [data-level="success"] .status-icon,
    [data-level="success"] .status-value {
      color: var(--u-widget-positive, #15803d);
    }
    [data-level="warning"] .status-icon,
    [data-level="warning"] .status-value {
      color: var(--u-widget-warning, #d97706);
    }
    [data-level="error"] .status-icon,
    [data-level="error"] .status-value {
      color: var(--u-widget-negative, #dc2626);
    }
    [data-level="neutral"] .status-icon,
    [data-level="neutral"] .status-value {
      color: var(--u-widget-text-secondary, #5b6777);
    }

    @container uw-status (max-width: 20rem) {
      .status-list { gap: 8px 16px; }
      .status-item { font-size: var(--u-widget-font-size-label, 0.8125rem); }
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
      <div class="status-list" part="status" role="list" aria-label=${this.spec.title ?? localeStringsOf(this.spec).status}>
        ${items.map(item => html`
          <div class="status-item" part="status-item" role="listitem" data-level=${item.level}>
            <span class="status-icon" part="status-icon" aria-hidden="true">${LEVEL_ICONS[item.level]}</span>
            ${item.label === undefined ? nothing : html`<span class="status-label" part="status-label">${item.label}</span>`}
            <span class="status-value" part="status-value">${item.value}</span>
          </div>
        `)}
      </div>
    `;
  }

  /** Items with a `value`; `label` is optional — without one an item is a badge showing its value. */
  private _extractItems(): StatusItem[] {
    const data = this.spec?.data;
    if (!data || typeof data !== 'object') return [];
    const rows = (Array.isArray(data) ? data : [data]) as unknown[];
    return rows
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object' && 'value' in item)
      .map(item => ({
        ...(item.label !== undefined && item.label !== null && { label: String(item.label) }),
        value: String(item.value),
        level: this._resolveLevel(item.level),
      }));
  }

  private _resolveLevel(level: unknown): StatusLevel {
    const s = String(level ?? 'info');
    return VALID_LEVELS.has(s) ? s as StatusLevel : 'info';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-status': UwStatus;
  }
}
