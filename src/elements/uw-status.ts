import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';
import { normalizeEmphasis, normalizeTone, toneLabel, toneMark, toneStyles, type Emphasis, type Tone } from '../core/tone.js';

interface StatusItem {
  /** Absent for a badge that shows the value alone ("● Running"). */
  label?: string;
  value: string;
  tone?: Tone;
  /** The item's mark — its tone's when not given. */
  glyph?: string;
  emphasis?: Emphasis;
}

/**
 * <uw-status> — Status indicator widget.
 *
 * Renders one or more status items with label, value, and a tone (`core/tone.ts`) — its colour and mark. An item
 * with a tone and no value shows the tone's name; `emphasis` (invert · hatch · stamp · blink) adds a second channel.
 * Single item or array of items.
 */
@customElement('uw-status')
export class UwStatus extends LitElement {
  static styles = [themeStyles, toneStyles, css`
    /* 세로 flex 인 이유: 아래 렌더 루트가 flex item 이어야 호스트 제약이 그것에 닿는다.
       안쪽 status-list 의 가로 wrap 설계와는 다른 축이다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      container: uw-status / inline-size;
    }

    /* ⚠flex-wrap 은 «가로» 축 설계라 그대로 둔다 — 여기서 여는 것은 «세로» 축뿐이다.
       항목이 여러 행으로 감기면서 길어진 높이가 호스트 제약을 넘던 자리다. */
    /* 호스트가 더 높으면 줄들은 위에 모인다 — 기본값(stretch)은 남는 높이를 줄 사이에 나눠 항목을 흩어 놓는다. */
    .status-list {
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
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

    [data-tone] .status-icon,
    [data-tone] .status-value {
      color: var(--tone);
    }

    .status-item[data-emphasis='invert'],
    .status-item[data-emphasis='hatch'] {
      padding: 1px 6px;
      border-radius: 3px;
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
          <div class="status-item" part="status-item" role="listitem" data-tone=${item.tone ?? nothing} data-emphasis=${item.emphasis ?? nothing}>
            ${item.tone ? html`<span class="status-icon" part="status-icon" aria-hidden="true">${toneMark(item.tone, item.glyph)}</span>` : nothing}
            ${item.label === undefined ? nothing : html`<span class="status-label" part="status-label">${item.label}</span>`}
            <span class=${item.emphasis === 'stamp' ? 'status-value tone-stamp' : 'status-value'} part="status-value">${item.value}</span>
          </div>
        `)}
      </div>
    `;
  }

  /** Items with a `value` or a `tone`; `label` is optional — without one an item is a badge showing its value. */
  private _extractItems(): StatusItem[] {
    const data = this.spec?.data;
    if (!data || typeof data !== 'object') return [];
    const strings = localeStringsOf(this.spec);
    const rows = (Array.isArray(data) ? data : [data]) as unknown[];
    return rows
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
      .flatMap(item => {
        const tone = normalizeTone(item.tone, 'uw-status');
        const hasValue = item.value !== undefined && item.value !== null && item.value !== '';
        if (!hasValue && !tone) return [];
        return [{
          ...(item.label !== undefined && item.label !== null && { label: String(item.label) }),
          value: hasValue ? String(item.value) : toneLabel(tone!, strings),
          ...(tone && { tone }),
          ...(typeof item.glyph === 'string' && item.glyph !== '' && { glyph: item.glyph }),
          ...(item.emphasis != null && { emphasis: normalizeEmphasis(item.emphasis, 'uw-status') }),
        }];
      });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-status': UwStatus;
  }
}
