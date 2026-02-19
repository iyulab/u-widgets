import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetEvent } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

type RatingIcon = 'star' | 'heart' | 'thumb';

/** Icon characters for each type. [empty, half, full] */
const ICONS: Record<RatingIcon, [string, string, string]> = {
  star:  ['\u2606', '\u2605', '\u2605'],   // ☆, ★, ★
  heart: ['\u2661', '\u2665', '\u2665'],   // ♡, ♥, ♥
  thumb: ['\u{1F44D}', '\u{1F44D}', '\u{1F44D}'], // 👍
};

/**
 * <u-rating> — Star/heart/thumb rating widget.
 *
 * Display-only or interactive mode. Supports fractional values for display.
 */
@customElement('u-rating')
export class URating extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-rating / inline-size;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rating-icons {
      display: flex;
      gap: 2px;
    }

    .rating-icon {
      font-size: 1.25rem;
      cursor: default;
      user-select: none;
      transition: transform 0.1s;
      position: relative;
      line-height: 1;
    }

    .rating-icon[data-interactive] {
      cursor: pointer;
    }

    .rating-icon[data-interactive]:hover {
      transform: scale(1.2);
    }

    /* Colors by state */
    .rating-icon[data-state="empty"] {
      color: var(--u-widget-text-secondary, #94a3b8);
    }

    .rating-icon[data-state="full"] {
      color: #f59e0b;
    }

    .rating-icon[data-state="half"] {
      color: #f59e0b;
    }

    .rating-icon[data-icon="heart"][data-state="full"],
    .rating-icon[data-icon="heart"][data-state="half"] {
      color: #ef4444;
    }

    .rating-icon[data-icon="thumb"][data-state="full"] {
      color: var(--u-widget-primary, #4f46e5);
    }

    /* Half-star overlay */
    .rating-icon-half {
      position: relative;
      display: inline-block;
    }

    .rating-icon-half .half-overlay {
      position: absolute;
      left: 0;
      top: 0;
      overflow: hidden;
      width: 50%;
    }

    /* Value display */
    .rating-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
    }

    .rating-count {
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    .rating-label {
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    /* Hover preview */
    .rating-icon[data-preview="true"] {
      color: #f59e0b;
    }

    .rating-icon[data-icon="heart"][data-preview="true"] {
      color: #ef4444;
    }

    .rating-icon[data-icon="thumb"][data-preview="true"] {
      color: var(--u-widget-primary, #4f46e5);
    }

    @container u-rating (max-width: 20rem) {
      .rating-icon { font-size: 1rem; }
      .rating-value { font-size: 0.8125rem; }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  @state()
  private _hoverIdx = -1;

  render() {
    if (!this.spec) return nothing;

    const data = (this.spec.data ?? {}) as Record<string, unknown>;
    const options = (this.spec.options ?? {}) as Record<string, unknown>;

    const value = typeof data.value === 'number' ? data.value : 0;
    const max = typeof options.max === 'number' ? options.max : (typeof data.max === 'number' ? data.max : 5);
    const interactive = Boolean(options.interactive ?? false);
    const icon = this._resolveIcon(options.icon);
    const labelText = typeof options.label === 'string' ? options.label : undefined;
    const count = typeof data.count === 'number' ? data.count : undefined;

    const icons = ICONS[icon];
    const displayValue = this._hoverIdx >= 0 ? this._hoverIdx + 1 : value;

    return html`
      <div class="rating" part="rating" role=${interactive ? 'radiogroup' : 'img'}
           aria-label=${this.spec.title ?? labelText ?? `Rating: ${value} out of ${max}`}>
        ${labelText ? html`<span class="rating-label" part="rating-label">${labelText}</span>` : nothing}
        <div class="rating-icons" part="rating-icons"
             @mouseleave=${interactive ? () => { this._hoverIdx = -1; } : undefined}>
          ${Array.from({ length: max }, (_, i) => this._renderIcon(i, displayValue, icons, icon, interactive))}
        </div>
        ${!interactive && value > 0 ? html`<span class="rating-value" part="rating-value">${value}</span>` : nothing}
        ${count != null ? html`<span class="rating-count" part="rating-count">(${count})</span>` : nothing}
      </div>
    `;
  }

  private _renderIcon(idx: number, value: number, icons: [string, string, string], iconType: RatingIcon, interactive: boolean) {
    const pos = idx + 1;
    const isPreview = interactive && this._hoverIdx >= 0 && pos <= this._hoverIdx + 1;

    let state: 'empty' | 'half' | 'full';
    if (isPreview) {
      state = 'full';
    } else if (pos <= Math.floor(value)) {
      state = 'full';
    } else if (pos === Math.ceil(value) && value % 1 >= 0.25 && value % 1 < 0.75) {
      // Thumb icon has no distinct half glyph — round to nearest
      state = iconType === 'thumb' ? (value % 1 >= 0.5 ? 'full' : 'empty') : 'half';
    } else {
      state = 'empty';
    }

    const char = state === 'half' ? icons[0] : (state === 'full' ? icons[2] : icons[0]);

    if (state === 'half') {
      return html`
        <span class="rating-icon rating-icon-half"
              data-state="half" data-icon=${iconType}
              ?data-interactive=${interactive}
              ?data-preview=${isPreview}
              role=${interactive ? 'radio' : 'presentation'}
              aria-label=${interactive ? `${pos}` : nothing}
              @mouseenter=${interactive ? () => { this._hoverIdx = idx; } : undefined}
              @click=${interactive ? () => this._select(pos) : undefined}>
          <span aria-hidden="true">${icons[0]}</span>
          <span class="half-overlay" aria-hidden="true">
            <span style="color: inherit">${icons[2]}</span>
          </span>
        </span>
      `;
    }

    return html`
      <span class="rating-icon"
            data-state=${state} data-icon=${iconType}
            ?data-interactive=${interactive}
            ?data-preview=${isPreview}
            role=${interactive ? 'radio' : 'presentation'}
            aria-label=${interactive ? `${pos}` : nothing}
            aria-checked=${interactive ? String(state === 'full' && !isPreview) : nothing}
            @mouseenter=${interactive ? () => { this._hoverIdx = idx; } : undefined}
            @click=${interactive ? () => this._select(pos) : undefined}>
        <span aria-hidden="true">${char}</span>
      </span>
    `;
  }

  private _select(value: number) {
    this.dispatchEvent(
      new CustomEvent('u-widget-internal', {
        detail: {
          type: 'submit',
          widget: 'rating',
          id: this.spec?.id,
          data: { value },
        } satisfies UWidgetEvent,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _resolveIcon(icon: unknown): RatingIcon {
    const s = String(icon ?? 'star');
    return s === 'heart' || s === 'thumb' ? s : 'star';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-rating': URating;
  }
}
