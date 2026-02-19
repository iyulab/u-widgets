import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

interface GalleryItem {
  src: string;
  alt?: string;
  caption?: string;
}

@customElement('u-gallery')
export class UGallery extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-gallery / inline-size;
    }

    .gallery-grid {
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
      font-size: 0.75rem;
      color: var(--u-widget-text-secondary, #64748b);
      background: var(--u-widget-surface, #f1f5f9);
    }

    @container u-gallery (max-width: 20rem) {
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
      .map((d) => ({
        src: this._sanitizeUrl(String(d.src)),
        alt: d.alt ? String(d.alt) : undefined,
        caption: d.caption ? String(d.caption) : undefined,
      }))
      .filter((item) => item.src); // Remove items with blocked URLs

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
        aria-label=${title ?? 'Gallery'}
        style="grid-template-columns: ${gridCols}">
        ${items.map((item) => this._renderItem(item, aspectStyle))}
      </div>
    `;
  }

  private _renderItem(item: GalleryItem, aspectStyle: string) {
    return html`
      <figure class="gallery-item" part="gallery-item" role="listitem" style=${aspectStyle || nothing}>
        <img
          src=${item.src}
          alt=${item.alt ?? ''}
          loading="lazy"
          part="gallery-image"
        />
        ${item.caption ? html`<figcaption class="gallery-caption" part="gallery-caption">${item.caption}</figcaption>` : nothing}
      </figure>
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
    'u-gallery': UGallery;
  }
}
