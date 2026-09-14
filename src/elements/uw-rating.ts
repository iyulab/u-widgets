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
 * <uw-rating> — Star/heart/thumb rating widget.
 *
 * Display-only or interactive mode. Supports fractional values for display.
 */
@customElement('uw-rating')
export class UwRating extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-rating / inline-size;
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
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* 누를 수 있는 아이콘은 WCAG 2.2 SC 2.5.8 의 24px 하한을 갖는다 — 글리프 크기는 그대로 두고
       상자만 넓힌다(글리프는 가운데에 남는다). */
    .rating-icon[data-interactive] {
      cursor: pointer;
      min-inline-size: 24px;
      min-block-size: 24px;
      border-radius: 4px;
    }

    .rating-icon[data-interactive]:hover {
      transform: scale(1.2);
    }

    .rating-icon[data-interactive]:focus-visible {
      outline: 2px solid var(--u-widget-primary, #4f46e5);
      outline-offset: 1px;
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
    /* 반쪽 채움은 상자 전체를 덮는 겹침을 가운데 정렬한 뒤 오른쪽 절반을 잘라 낸다 — 상자가
       글리프보다 넓어도(누를 수 있는 아이콘) 겹친 글리프가 아래 글리프와 정확히 포개진다. */
    .rating-icon-half .half-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      clip-path: inset(0 50% 0 0);
    }

    /* Value display */
    .rating-value {
      font-size: var(--u-widget-font-size, 0.875rem);
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
    }

    .rating-count {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .rating-label {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
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

    @container uw-rating (max-width: 20rem) {
      .rating-icon { font-size: 1rem; }
      .rating-value { font-size: var(--u-widget-font-size-label, 0.8125rem); }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  @state()
  private _hoverIdx = -1;

  /** Icon the keyboard last moved to; `-1` until the group has been navigated. */
  @state()
  private _focusIdx = -1;

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
    // 라디오 그룹은 탭 정지가 하나다 — 키보드가 옮겨 둔 자리, 없으면 현재 값, 값이 없으면 첫 아이콘.
    const tabIdx = this._focusIdx >= 0
      ? Math.min(this._focusIdx, max - 1)
      : Math.min(Math.max(Math.round(value) - 1, 0), max - 1);

    return html`
      <div class="rating" part="rating" role=${interactive ? 'radiogroup' : 'img'}
           aria-label=${this.spec.title ?? labelText ?? `Rating: ${value} out of ${max}`}>
        ${labelText ? html`<span class="rating-label" part="rating-label">${labelText}</span>` : nothing}
        <div class="rating-icons" part="rating-icons"
             @mouseleave=${interactive ? () => { this._hoverIdx = -1; } : undefined}
             @keydown=${interactive ? (e: KeyboardEvent) => this._onKeydown(e, max) : undefined}
             @focusout=${interactive ? (e: FocusEvent) => this._onFocusOut(e) : undefined}>
          ${Array.from({ length: max }, (_, i) => this._renderIcon(i, displayValue, Math.round(value), icons, icon, interactive, i === tabIdx))}
        </div>
        ${!interactive && value > 0 ? html`<span class="rating-value" part="rating-value">${value}</span>` : nothing}
        ${count != null ? html`<span class="rating-count" part="rating-count">(${count})</span>` : nothing}
      </div>
    `;
  }

  private _renderIcon(idx: number, value: number, checkedPos: number, icons: [string, string, string], iconType: RatingIcon, interactive: boolean, tabStop: boolean) {
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

    const char = state === 'full' ? icons[2] : icons[0];

    // 🔴상태마다 템플릿을 갈라 쓰지 않는다 — 템플릿이 바뀌면 Lit 이 노드를 새로 만들고, 미리보기로
    //   반쪽↔채움이 바뀌는 순간 포커스를 가진 아이콘이 DOM 에서 사라진다(키보드 탐색이 끊긴다).
    // 라디오 그룹에서 «선택됨» 은 하나뿐이다 — 미리보기가 아니라 확정된 값의 자리다.
    return html`
      <span class="rating-icon ${state === 'half' ? 'rating-icon-half' : ''}"
            data-state=${state} data-icon=${iconType}
            ?data-interactive=${interactive}
            ?data-preview=${isPreview}
            role=${interactive ? 'radio' : 'presentation'}
            aria-label=${interactive ? `${pos}` : nothing}
            aria-checked=${interactive ? String(pos === checkedPos) : nothing}
            tabindex=${interactive ? (tabStop ? '0' : '-1') : nothing}
            @mouseenter=${interactive ? () => { this._hoverIdx = idx; } : undefined}
            @click=${interactive ? () => this._select(pos) : undefined}>
        <span aria-hidden="true">${char}</span>
        ${state === 'half'
          ? html`<span class="half-overlay" aria-hidden="true"><span style="color: inherit">${icons[2]}</span></span>`
          : nothing}
      </span>
    `;
  }

  /**
   * 화살표는 «미리보기» 를 옮기고 Enter/Space 가 확정한다 — 마우스의 호버(미리보기)와 클릭(확정)을
   * 그대로 따른다. 확정은 `submit` 이벤트이므로 화살표마다 내보내지 않는다.
   */
  private _onKeydown(e: KeyboardEvent, max: number) {
    const icons = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>('.rating-icon[data-interactive]') ?? [],
    );
    const current = icons.indexOf(e.target as HTMLElement);
    if (current < 0) return;

    let next = -1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(current + 1, max - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(current - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = max - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._select(current + 1);
        return;
      default:
        return;
    }

    e.preventDefault();
    this._focusIdx = next;
    this._hoverIdx = next;
    void this.updateComplete.then(() => {
      this.shadowRoot?.querySelectorAll<HTMLElement>('.rating-icon[data-interactive]')[next]?.focus();
    });
  }

  private _onFocusOut(e: FocusEvent) {
    const to = e.relatedTarget as Node | null;
    if (to && (e.currentTarget as HTMLElement).contains(to)) return;
    this._focusIdx = -1;
    this._hoverIdx = -1;
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
    'uw-rating': UwRating;
  }
}
