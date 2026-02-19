import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

/**
 * <u-kv> — Key-value pair display widget.
 *
 * Renders structured key-value data in vertical, horizontal, or grid layout.
 * Data can be a flat object or an array of { key, value } pairs.
 */
@customElement('u-kv')
export class UKv extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-kv / inline-size;
    }

    .kv-vertical {
      display: grid;
      grid-template-columns: auto auto;
      gap: 8px 12px;
      justify-content: center;
    }

    .kv-horizontal {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 24px;
    }

    .kv-grid {
      display: grid;
      gap: 8px 24px;
    }

    .kv-pair {
      display: flex;
      gap: 8px;
      align-items: baseline;
      min-width: 0;
    }

    .kv-vertical .kv-pair {
      display: contents;
    }

    .kv-vertical .kv-key {
      text-align: right;
    }

    .kv-vertical .kv-value {
      text-align: left;
    }

    .kv-key {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--u-widget-text-secondary, #64748b);
      flex-shrink: 0;
    }

    .kv-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .kv-horizontal .kv-pair {
      flex-direction: column;
      gap: 2px;
    }

    .kv-horizontal .kv-value {
      text-align: left;
    }

    .kv-grid .kv-pair {
      flex-direction: column;
      gap: 2px;
    }

    .kv-grid .kv-value {
      text-align: left;
    }

    @container u-kv (max-width: 20rem) {
      .kv-horizontal {
        flex-direction: column;
        gap: 8px;
      }

      .kv-key {
        font-size: 0.75rem;
      }

      .kv-value {
        font-size: 0.8125rem;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  render() {
    if (!this.spec) return nothing;

    const pairs = this._extractPairs();
    if (pairs.length === 0) return nothing;

    const options = (this.spec.options ?? {}) as Record<string, unknown>;
    const layout = String(options.layout ?? 'vertical');
    const columns = Number(options.columns ?? 2);

    const gridStyle = layout === 'grid'
      ? `grid-template-columns: repeat(${columns}, 1fr)`
      : '';

    return html`
      <div
        class=${`kv-${layout === 'grid' ? 'grid' : layout === 'horizontal' ? 'horizontal' : 'vertical'}`}
        style=${gridStyle}
        part="kv"
        role="list"
        aria-label=${this.spec.title ?? 'Key-value pairs'}
      >
        ${pairs.map(([key, value]) => html`
          <div class="kv-pair" part="kv-pair" role="listitem">
            <span class="kv-key" part="kv-key">${key}</span>
            <span class="kv-value" part="kv-value">${String(value)}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _extractPairs(): [string, unknown][] {
    const data = this.spec?.data;
    if (!data) return [];

    // Array of { key, value } objects
    if (Array.isArray(data)) {
      return data
        .filter((item): item is Record<string, unknown> =>
          item != null && typeof item === 'object' && 'key' in item && 'value' in item)
        .map((item) => [String(item.key), item.value]);
    }

    // Flat object — all keys become pairs
    if (typeof data === 'object') {
      return Object.entries(data as Record<string, unknown>);
    }

    return [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-kv': UKv;
  }
}
