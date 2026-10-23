import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf, formatTemplate } from '../core/locale.js';
import { formatValue } from '../core/format.js';
import { normalizeTone, toneStyles, type Tone } from '../core/tone.js';
import { themeStyles } from '../styles/tokens.js';

interface Row {
  label: string;
  value: number;
  /** The value as written — formatted, with its unit. */
  text: string;
  max?: number;
  tone?: Tone;
  note?: string;
}

/** More glyphs than this in a row is no longer a count one can read at a glance — the row is drawn as a bar. */
const MAX_GLYPHS = 60;

function text(value: unknown): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function positive(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * <uw-bar-list> — items compared as bars: a label, the value written beside it, the bar under them.
 *
 * Each item is `{ label, value, max?, unit?, format?, tone?, note? }`. The bars share one scale — `options.max`, else
 * the largest value — unless an item has its own `max` (a stock against its own shelf). A tone colours an item's bar.
 * `options.form: "pictogram"` draws each value as glyphs (`options.glyph`, one per `options.glyphValue`), with the rest
 * of the item's scale as faint glyphs; a row that would need more than sixty glyphs is a bar. `options.maxItems` shows
 * the first rows and says how many more.
 */
@customElement('uw-bar-list')
export class UwBarList extends LitElement {
  static styles = [themeStyles, toneStyles, css`
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      color: var(--u-widget-text, #1a1a2e);
      font-size: var(--u-widget-font-size, 0.875rem);
    }

    .rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .row { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
    .label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .value {
      flex: none;
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .row[data-tone] .value { color: var(--tone); }

    .bar {
      height: 8px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--u-widget-text-secondary, #5b6777) 18%, transparent);
      overflow: hidden;
    }
    .fill { height: 100%; border-radius: inherit; background: var(--tone, var(--u-widget-primary, #4f46e5)); }

    .glyphs {
      line-height: 1.1;
      letter-spacing: 1px;
      overflow-wrap: anywhere;
      color: var(--tone, var(--u-widget-primary, #4f46e5));
    }
    .glyphs .rest { opacity: 0.22; }

    .note {
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      line-height: 1.3;
    }
    .more {
      flex: none;
      margin-top: 6px;
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    const rows = this._rows();
    if (rows.length === 0) return nothing;
    const options = this.spec?.options ?? {};
    const scale = positive(options.max) ?? Math.max(...rows.map(r => r.value), 0);
    const pictogram = options.form === 'pictogram';
    const glyph = text(options.glyph) ?? '●';
    const per = positive(options.glyphValue) ?? 1;
    const limit = typeof options.maxItems === 'number' && options.maxItems > 0 ? Math.floor(options.maxItems) : undefined;
    const shown = limit !== undefined && rows.length > limit ? rows.slice(0, limit) : rows;
    const strings = localeStringsOf(this.spec);

    return html`
      <ul class="rows" part="rows" role="list" aria-label=${this.spec?.title ?? nothing}>
        ${shown.map(r => {
          const max = r.max ?? scale;
          const fraction = max > 0 ? Math.min(1, Math.max(0, r.value / max)) : 0;
          const on = Math.round(Math.max(0, r.value) / per);
          const all = Math.max(on, Math.round(max / per));
          const asGlyphs = pictogram && all <= MAX_GLYPHS;
          return html`
            <li class="row" part="row" data-tone=${r.tone ?? nothing} aria-label=${`${r.label}: ${r.text}`}>
              <div class="head" aria-hidden="true">
                <span class="label" part="label">${r.label}</span><span class="value" part="value">${r.text}</span>
              </div>
              ${asGlyphs
                ? html`<div class="glyphs" part="glyphs" aria-hidden="true">${glyph.repeat(on)}<span class="rest">${glyph.repeat(all - on)}</span></div>`
                : html`<div class="bar" part="bar" aria-hidden="true"><div class="fill" style="width:${(fraction * 100).toFixed(1)}%"></div></div>`}
              ${r.note ? html`<div class="note" part="note">${r.note}</div>` : nothing}
            </li>`;
        })}
      </ul>
      ${shown.length < rows.length
        ? html`<div class="more" part="more">${formatTemplate(strings.moreItems, { count: rows.length - shown.length })}</div>`
        : nothing}
    `;
  }

  private _rows(): Row[] {
    const data = this.spec?.data;
    if (!Array.isArray(data)) return [];
    const locale = typeof this.spec?.options?.locale === 'string' ? this.spec.options.locale : undefined;
    return data
      .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object' && text(r.label) !== undefined)
      .flatMap(r => {
        const value = typeof r.value === 'number' ? r.value : Number(r.value);
        if (r.value == null || r.value === '' || !Number.isFinite(value)) return [];
        return [{
          label: String(r.label),
          value,
          text: `${typeof r.format === 'string' ? formatValue(value, r.format, locale) : String(value)}${text(r.unit) ? ` ${r.unit}` : ''}`,
          max: positive(r.max),
          tone: normalizeTone(r.tone, 'uw-bar-list'),
          note: text(r.note),
        }];
      });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-bar-list': UwBarList;
  }
}
