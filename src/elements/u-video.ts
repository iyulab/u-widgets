import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

@customElement('u-video')
export class UVideo extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-video / inline-size;
    }

    .video-container {
      text-align: center;
    }

    video {
      max-width: 100%;
      border-radius: 6px;
      background: #000;
    }

    .video-caption {
      margin-top: 6px;
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    @container u-video (max-width: 20rem) {
      video {
        border-radius: 4px;
      }

      .video-caption {
        font-size: 0.75rem;
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
    'u-video': UVideo;
  }
}
