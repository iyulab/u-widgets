import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

@customElement('uw-video')
export class UwVideo extends LitElement {
  static styles = [themeStyles, css`
    /* 세로 flex 인 이유: 아래 렌더 루트가 flex item 이어야 호스트 제약이 그것에 닿는다(cycle-569). */
    :host {
      display: flex;
      flex-direction: column;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-video / inline-size;
    }

    /* ⚠video 요소를 세로로 줄이지 않는다 — 종횡비가 바뀌면 그것은 시각 계약 변경이다.
       제약이 오면 캡션까지 포함한 상자를 스크롤로 넘긴다(cycle-569). */
    .video-container {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      text-align: center;
    }

    video {
      max-width: 100%;
      border-radius: 6px;
      background: #000;
    }

    .video-caption {
      margin-top: 6px;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    @container uw-video (max-width: 20rem) {
      video {
        border-radius: 4px;
      }

      .video-caption {
        font-size: var(--u-widget-font-size-caption, 0.75rem);
        margin-top: 4px;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    if (!this.spec) return nothing;

    const data = this.spec.data as Record<string, unknown> | undefined;
    if (!data) return nothing;

    const rawSrc = String(data.src ?? '');
    const src = this._sanitizeUrl(rawSrc);
    if (!src) return nothing;

    const poster = data.poster ? this._sanitizeUrl(String(data.poster)) : undefined;
    const alt = String(data.alt ?? '');
    const caption = data.caption as string | undefined;

    const opts = (this.spec.options ?? {}) as Record<string, unknown>;
    const controls = opts.controls !== false; // default true
    const autoplay = opts.autoplay === true;
    const loop = opts.loop === true;
    const muted = opts.muted === true || autoplay; // autoplay requires muted in most browsers

    return html`
      <div class="video-container" part="video">
        <video
          src=${src}
          poster=${poster ?? nothing}
          aria-label=${alt || nothing}
          ?controls=${controls}
          ?autoplay=${autoplay}
          ?loop=${loop}
          ?muted=${muted}
          playsinline
          preload="metadata"
          part="video-element"
        ></video>
        ${caption ? html`<div class="video-caption" part="caption">${caption}</div>` : nothing}
      </div>
    `;
  }

  private _sanitizeUrl(url: string): string {
    const stripped = url.replace(/[\s\u200B\u200C\u200D\uFEFF\u00AD\u200E\u200F]/g, '');
    if (/^(javascript|data|vbscript):/i.test(stripped)) return '';
    return url;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-video': UwVideo;
  }
}
