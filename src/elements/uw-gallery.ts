import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';
import { checkMediaUrl } from '../core/media.js';
import { mediaBlocked, mediaBlockedStyles } from '../styles/media-blocked.js';

interface GalleryItem {
  src: string;
  /** The URL was refused by origin: draw the `alt` text instead of the picture. */
  blocked: boolean;
  alt?: string;
  caption?: string;
}

@customElement('uw-gallery')
export class UwGallery extends LitElement {
  static styles = [themeStyles, mediaBlockedStyles, css`
    /* 세로 flex 인 이유: 아래 격자가 flex item 이어야 호스트 제약이 그것에 닿는다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      container: uw-gallery / inline-size;
    }

    /* 그리드 열 수는 컨테이너 쿼리가 정하고, 세로로 길어진 격자는 호스트 제약을 넘었다 ⇒
       스크롤 주인이 된다. 열 수를 줄여 맞추는 쪽은 시각 계약 변경이라 택하지 않았다. */
    .gallery-grid {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      display: grid;
      gap: 8px;
    }

    .gallery-item {
      overflow: hidden;
      border-radius: 6px;
      background: var(--u-widget-surface, #f1f5f9);
    }

    .gallery-item img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gallery-caption {
      padding: 4px 8px;
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      color: var(--u-widget-text-secondary, #5b6777);
      background: var(--u-widget-surface, #f1f5f9);
    }

    @container uw-gallery (max-width: 20rem) {
      .gallery-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    if (!this.spec) return nothing;

    const data = this.spec.data;
    if (!Array.isArray(data)) return nothing;

    const items = (data as Record<string, unknown>[])
      .filter((d) => d && typeof d.src === 'string' && d.src)
      .map((d) => {
        const media = checkMediaUrl(String(d.src));
        return {
          src: media.src,
          blocked: media.blocked,
          alt: d.alt ? String(d.alt) : undefined,
          caption: d.caption ? String(d.caption) : undefined,
        };
      })
      .filter((item) => item.src || item.blocked); // Drop items whose URL is a script or data URL; keep a stand-in for one refused by origin

    if (items.length === 0) return nothing;

    const opts = (this.spec.options ?? {}) as Record<string, unknown>;
    const columns = Number(opts.columns) || 0;
    const aspectRatio = String(opts.aspectRatio ?? 'auto');

    const gridCols = columns > 0
      ? `repeat(${columns}, 1fr)`
      : `repeat(auto-fill, minmax(150px, 1fr))`;

    const aspectStyle = aspectRatio !== 'auto'
      ? `aspect-ratio: ${aspectRatio.replace(':', '/')};`
      : '';

    const title = this.spec.title;

    return html`
      <div class="gallery-grid" part="gallery" role="list"
        aria-label=${title ?? localeStringsOf(this.spec).gallery}
        style="grid-template-columns: ${gridCols}">
        ${items.map((item) => this._renderItem(item, aspectStyle))}
      </div>
    `;
  }

  private _renderItem(item: GalleryItem, aspectStyle: string) {
    return html`
      <figure class="gallery-item" part="gallery-item" role="listitem" style=${aspectStyle || nothing}>
        ${item.blocked
          ? mediaBlocked(item.alt)
          : html`<img
          src=${item.src}
          alt=${item.alt ?? ''}
          loading="lazy"
          part="gallery-image"
        />`}
        ${item.caption ? html`<figcaption class="gallery-caption" part="gallery-caption">${item.caption}</figcaption>` : nothing}
      </figure>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-gallery': UwGallery;
  }
}
