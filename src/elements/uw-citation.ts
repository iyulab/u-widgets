import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetEvent } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

interface CitationItem {
  title: string;
  url?: string;
  snippet?: string;
  source?: string;
}

/**
 * <uw-citation> — Source/reference card widget.
 *
 * Renders one or more citations with title, URL, snippet, and source.
 * Supports compact (single-line) and numbered display modes.
 */
@customElement('uw-citation')
export class UwCitation extends LitElement {
  static styles = [themeStyles, css`
    /* 세로 flex 인 이유: 아래 렌더 루트가 flex item 이어야 호스트 제약이 그것에 닿는다.
       display:block 이면 루트의 flex 선언이 무시되고 픽셀이 1도 움직이지 않는다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-citation / inline-size;
    }

    /* 호스트에 높이·max-height 가 주어지면 그 제약이 여기까지 닿아야 한다. 제약이 없으면
       flex-basis 가 auto 라 종전처럼 항목 전체 높이로 자란다. */
    .citations {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      gap: 8px;
    }

    .cite-item {
      display: flex;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      background: var(--u-widget-bg, #fff);
      cursor: default;
      transition: border-color 0.15s;
    }
    .cite-item[data-link] {
      cursor: pointer;
      color: inherit;
      text-decoration: none;
    }
    .cite-item[data-link]:hover {
      border-color: var(--u-widget-primary, #4f46e5);
    }
    .cite-item[data-link]:focus-visible {
      outline: 2px solid var(--u-widget-primary, #4f46e5);
      outline-offset: 2px;
    }

    .cite-num {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: var(--u-widget-surface, #f1f5f9);
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .cite-body {
      flex: 1;
      min-width: 0;
    }

    .cite-title {
      font-size: var(--u-widget-font-size, 0.875rem);
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cite-item[data-link] .cite-title {
      color: var(--u-widget-primary, #4f46e5);
    }

    .cite-url {
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      color: var(--u-widget-text-secondary, #94a3b8);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 1px;
    }

    .cite-snippet {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
      margin-top: 4px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .cite-source {
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      color: var(--u-widget-text-secondary, #94a3b8);
      margin-top: 4px;
    }

    /* Compact mode */
    .citations[data-compact] .cite-item {
      padding: 6px 10px;
    }
    .citations[data-compact] .cite-snippet,
    .citations[data-compact] .cite-source { display: none; }

    @container uw-citation (max-width: 20rem) {
      .cite-title { font-size: var(--u-widget-font-size-label, 0.8125rem); }
      .cite-snippet { font-size: var(--u-widget-font-size-caption, 0.75rem); }
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

    const options = (this.spec.options ?? {}) as Record<string, unknown>;
    const compact = Boolean(options.compact ?? false);
    const numbered = options.numbered !== false;

    return html`
      <div class="citations" part="citations" ?data-compact=${compact} role="list" aria-label=${this.spec.title ?? 'Citations'}>
        ${items.map((item, i) => this._renderItem(item, i, numbered))}
      </div>
    `;
  }

  private _renderItem(item: CitationItem, index: number, numbered: boolean) {
    const safeUrl = this._safeUrl(item);
    const displayUrl = item.url ? this._extractDomain(item.url) : undefined;

    const content = html`
      ${numbered ? html`<span class="cite-num" part="cite-num">${index + 1}</span>` : nothing}
      <div class="cite-body">
        <div class="cite-title" part="cite-title">${item.title}</div>
        ${displayUrl ? html`<div class="cite-url" part="cite-url">${displayUrl}</div>` : nothing}
        ${item.snippet ? html`<div class="cite-snippet" part="cite-snippet">${item.snippet}</div>` : nothing}
        ${item.source ? html`<div class="cite-source" part="cite-source">${item.source}</div>` : nothing}
      </div>
    `;

    // 링크 항목은 진짜 앵커다 — 클릭 가능한 div 는 포커스를 받지 못하고(키보드로 열 수 없다)
    // 보조기술에 링크로 드러나지도 않는다. listitem 역할은 앵커의 링크 역할을 덮어쓰므로 감싸는 쪽에 둔다.
    return html`
      <div role="listitem">
        ${safeUrl
          ? html`<a
              class="cite-item"
              part="cite-item"
              data-link
              href=${safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              @click=${() => this._handleClick(item, safeUrl)}
            >${content}</a>`
          : html`<div class="cite-item" part="cite-item">${content}</div>`}
      </div>
    `;
  }

  /** The item's URL when it is safe to link to, otherwise `undefined`. */
  private _safeUrl(item: CitationItem): string | undefined {
    if (!item.url) return undefined;

    // Sanitize URL — strip invisible chars and block dangerous protocols
    const safeUrl = item.url.replace(/[\s\u200B-\u200F\uFEFF\u00AD]/g, '');
    if (!safeUrl || /^(javascript|data|vbscript):/i.test(safeUrl)) return undefined;
    return safeUrl;
  }

  /** Report the navigation — the anchor itself opens the page. */
  private _handleClick(item: CitationItem, safeUrl: string) {
    this.dispatchEvent(
      new CustomEvent('u-widget-internal', {
        detail: {
          type: 'action',
          widget: 'citation',
          id: this.spec?.id,
          action: 'navigate',
          data: { url: safeUrl, title: item.title },
        } satisfies UWidgetEvent,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      // localhost나 IP 주소는 그대로 반환
      if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return hostname;
      }
      // www. 제거
      const withoutWww = hostname.replace(/^www\./, '');
      const parts = withoutWww.split('.');
      // ccTLD (co.kr, co.uk, com.au 등): 마지막 3파트 유지
      const ccTLDs = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac']);
      if (parts.length >= 3 && ccTLDs.has(parts[parts.length - 2])) {
        return parts.slice(-3).join('.');
      }
      // 일반적인 경우: 마지막 2파트
      return parts.slice(-2).join('.');
    } catch {
      return url;
    }
  }

  private _extractItems(): CitationItem[] {
    const data = this.spec?.data;
    if (!data) return [];

    // Array of citation objects
    if (Array.isArray(data)) {
      return data.filter((item): item is Record<string, unknown> =>
        item != null && typeof item === 'object' && 'title' in item,
      ).map(item => ({
        title: String(item.title ?? ''),
        url: item.url ? String(item.url) : undefined,
        snippet: item.snippet ? String(item.snippet) : undefined,
        source: item.source ? String(item.source) : undefined,
      }));
    }

    // Single citation object
    if (typeof data === 'object' && 'title' in data) {
      const d = data as Record<string, unknown>;
      return [{
        title: String(d.title ?? ''),
        url: d.url ? String(d.url) : undefined,
        snippet: d.snippet ? String(d.snippet) : undefined,
        source: d.source ? String(d.source) : undefined,
      }];
    }

    return [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-citation': UwCitation;
  }
}
