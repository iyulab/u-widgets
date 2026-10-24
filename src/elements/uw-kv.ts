import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';
import { formatValue } from '../core/format.js';
import { normalizeTone, toneMark, toneStyles, type Tone } from '../core/tone.js';

interface Pair {
  label: string;
  value: string;
  tone?: Tone;
  /** The value's mark — its tone's when not given. */
  glyph?: string;
  note?: string;
}

/**
 * <uw-kv> — Key-value pair display widget.
 *
 * Renders structured key-value data in vertical, horizontal, or grid layout.
 * Data can be a flat object or an array of `{ label, value, unit?, format?, tone?, glyph?, note? }` — each value formatted
 * with its unit, coloured and marked by its tone (or its own `glyph`), with a note under it.
 */
@customElement('uw-kv')
export class UwKv extends LitElement {
  static styles = [themeStyles, toneStyles, css`
    :host {
      display: block;
      font-family: var(--u-widget-font-family);
      container: uw-kv / inline-size;
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
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      font-weight: 500;
      color: var(--u-widget-text-secondary, #5b6777);
      flex-shrink: 0;
    }

    .kv-value {
      font-size: var(--u-widget-font-size, 0.875rem);
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .kv-value {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
    }
    .kv-pair[data-tone] .kv-value { color: var(--tone); }
    .kv-mark { margin-right: 3px; font-size: 0.85em; }
    .kv-note {
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      color: var(--u-widget-text-secondary, #5b6777);
      overflow-wrap: anywhere;
    }
    .kv-vertical .kv-note {
      grid-column: 2;
      margin-top: -6px;
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

    @container uw-kv (max-width: 20rem) {
      .kv-horizontal {
        flex-direction: column;
        gap: 8px;
      }

      .kv-key {
        font-size: var(--u-widget-font-size-caption, 0.75rem);
      }

      .kv-value {
        font-size: var(--u-widget-font-size-label, 0.8125rem);
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

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
        aria-label=${this.spec.title ?? localeStringsOf(this.spec).keyValuePairs}
      >
        ${pairs.map(p => html`
          <div class="kv-pair" part="kv-pair" role="listitem" data-tone=${p.tone ?? nothing}>
            <span class="kv-key" part="kv-key">${p.label}</span>
            <span class="kv-value" part="kv-value">${p.tone ? html`<span class="kv-mark" aria-hidden="true">${toneMark(p.tone, p.glyph)}</span>` : nothing}${p.value}</span>
            ${p.note ? html`<span class="kv-note" part="kv-note">${p.note}</span>` : nothing}
          </div>
        `)}
      </div>
    `;
  }

  private _extractPairs(): Pair[] {
    const data = this.spec?.data;
    if (!data) return [];
    const locale = typeof this.spec?.options?.locale === 'string' ? this.spec.options.locale : undefined;
    // Array of { label, value, … } — each value formatted with its unit, and its tone and note
    if (Array.isArray(data)) {
      return data
        .filter((item): item is Record<string, unknown> =>
          item != null && typeof item === 'object' && 'label' in item && 'value' in item)
        .map((item) => {
          const unit = item.unit == null || item.unit === '' ? '' : `\u00A0${item.unit}`;
          const tone = normalizeTone(item.tone, 'uw-kv');
          return {
            label: String(item.label),
            value: `${typeof item.format === 'string' ? formatValue(item.value, item.format, locale) : String(item.value)}${unit}`,
            ...(tone && { tone }),
            ...(typeof item.glyph === 'string' && item.glyph !== '' && { glyph: item.glyph }),
            ...(item.note != null && item.note !== '' && { note: String(item.note) }),
          };
        });
    }
    // Flat object — all keys become pairs
    if (typeof data === 'object') {
      return Object.entries(data as Record<string, unknown>).map(([label, value]) => ({ label, value: String(value) }));
    }
    return [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-kv': UwKv;
  }
}
