import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { formatValue } from '../core/format.js';
import { normalizeEmphasis, normalizeTone, toneLabel, toneStyles, TONES, TONE_GLYPHS, type Emphasis, type Tone } from '../core/tone.js';
import { themeStyles } from '../styles/tokens.js';

interface Cell {
  label?: string;
  value?: string;
  tone?: Tone;
  emphasis?: Emphasis;
}

const SHAPES = new Set(['square', 'chip', 'dot']);

function text(value: unknown): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

/**
 * <uw-status-grid> — many small cells, each with a state: seats, beds, bays, lamps, dice on a wafer.
 *
 * Each cell has a `tone` (`core/tone.ts`) and optionally a `label`, a `value` and an `emphasis` — the second channel besides colour
 * (`invert` a cell filled with its tone, `hatch` hatched, `blink` blinking, `stamp` a heavy frame: a cell is too small for a stamp's text). `options.columns` fixes how many go to
 * a row (otherwise as many as fit); `options.cell` is `square` (default — the label inside), `chip` (a wider pill) or
 * `dot` (the tone alone, the label as its name). `options.counts` adds a key: how many cells are in each tone, with the
 * tone's mark and name.
 */
@customElement('uw-status-grid')
export class UwStatusGrid extends LitElement {
  static styles = [themeStyles, toneStyles, css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: var(--u-widget-font-family);
      color: var(--u-widget-text, #1a1a2e);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--cell-min, 36px), 1fr));
      gap: 4px;
      flex: 1 1 auto;
      min-height: 0;
      align-content: start;
      overflow: hidden;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .grid[data-cell='chip'] { --cell-min: 64px; }
    .grid[data-cell='dot'] { --cell-min: 14px; gap: 6px; }

    .cell {
      --tone-fill: var(--tone, var(--u-widget-border, #e2e8f0));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 0;
      aspect-ratio: 1;
      border-radius: 4px;
      background: color-mix(in srgb, var(--tone-fill) 22%, transparent);
      border: 1px solid color-mix(in srgb, var(--tone-fill) 70%, transparent);
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      line-height: 1.15;
      text-align: center;
      overflow: hidden;
    }
    .grid[data-cell='chip'] .cell { aspect-ratio: auto; padding: 3px 6px; border-radius: 999px; }
    .grid[data-cell='dot'] .cell { border-radius: 50%; background: var(--tone-fill); border: none; }
    /* The shared emphasis rules set a background the cell's own would outrank (same specificity, later), so the cell says them itself. */
    .cell[data-emphasis='invert'] { background: var(--tone-fill); color: var(--u-widget-bg, #fff); }
    .cell[data-emphasis='invert'] .cell-value { color: inherit; }
    .cell[data-emphasis='hatch'] {
      background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--tone-fill) 38%, transparent) 0 5px, color-mix(in srgb, var(--tone-fill) 10%, transparent) 5px 10px);
    }
    .cell[data-emphasis='stamp'] { border-width: 2px; border-color: var(--tone-fill); font-weight: 700; }
    .cell-label {
      max-width: 100%;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cell-value {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .counts {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 14px;
      flex: none;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }
    .count-mark { color: var(--tone); margin-right: 3px; }
    .count-n {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
      margin-left: 4px;
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    const cells = this._cells();
    if (cells.length === 0) return nothing;
    const options = this.spec?.options ?? {};
    const shape = typeof options.cell === 'string' && SHAPES.has(options.cell) ? options.cell : 'square';
    const columns = typeof options.columns === 'number' && options.columns > 0 ? Math.floor(options.columns) : undefined;
    const strings = localeStringsOf(this.spec);
    const name = (c: Cell) => [c.label, c.value, c.tone ? toneLabel(c.tone, strings) : undefined].filter(Boolean).join(' · ');
    const counts = options.counts === true
      ? TONES.map(t => [t, cells.filter(c => c.tone === t).length] as const).filter(([, n]) => n > 0)
      : [];

    return html`
      <ul class="grid" part="grid" data-cell=${shape} role="list" aria-label=${this.spec?.title ?? strings.status}
        style=${columns ? `grid-template-columns: repeat(${columns}, minmax(0, 1fr))` : nothing}>
        ${cells.map(c => html`
          <li class="cell" part="cell" data-tone=${c.tone ?? nothing} data-emphasis=${c.emphasis ?? nothing} aria-label=${name(c) || nothing} title=${name(c) || nothing}>
            ${shape !== 'dot' && c.label ? html`<span class="cell-label" aria-hidden="true">${c.label}</span>` : nothing}
            ${shape !== 'dot' && c.value ? html`<span class="cell-value" aria-hidden="true">${c.value}</span>` : nothing}
          </li>`)}
      </ul>
      ${counts.length > 0 ? html`
        <ul class="counts" part="counts">
          ${counts.map(([t, n]) => html`<li data-tone=${t}><span class="count-mark" aria-hidden="true">${TONE_GLYPHS[t]}</span>${toneLabel(t, strings)}<span class="count-n">${n}</span></li>`)}
        </ul>` : nothing}
    `;
  }

  private _cells(): Cell[] {
    const data = this.spec?.data;
    if (!Array.isArray(data)) return [];
    const locale = typeof this.spec?.options?.locale === 'string' ? this.spec.options.locale : undefined;
    return data
      .filter((c): c is Record<string, unknown> => c != null && typeof c === 'object')
      .map(c => ({
        label: text(c.label),
        value: c.value == null || c.value === '' ? undefined
          : `${typeof c.format === 'string' ? formatValue(c.value, c.format, locale) : String(c.value)}${text(c.unit) ? ` ${c.unit}` : ''}`,
        tone: normalizeTone(c.tone, 'uw-status-grid'),
        emphasis: normalizeEmphasis(c.emphasis, 'uw-status-grid'),
      }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-status-grid': UwStatusGrid;
  }
}
