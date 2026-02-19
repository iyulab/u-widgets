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
 * <u-citation> — Source/reference card widget.
 *
 * Renders one or more citations with title, URL, snippet, and source.
 * Supports compact (single-line) and numbered display modes.
 */
@customElement('u-citation')
export class UCitation extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-citation / inline-size;
    }

    .citations {
      display: flex;
      flex-direction: column;
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
    .cite-item[data-link] { cursor: pointer; }
    .cite-item[data-link]:hover {
      border-color: var(--u-widget-primary, #4f46e5);
    }

    .cite-num {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: var(--u-widget-surface, #f1f5f9);
      font-size: 0.6875rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--u-widget-text-secondary, #64748b);
    }

    .cite-body {
      flex: 1;
      min-width: 0;
    }

    .cite-title {
      font-size: 0.875rem;
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
      font-size: 0.6875rem;
      color: var(--u-widget-text-secondary, #94a3b8);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 1px;
    }

    .cite-snippet {
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
      margin-top: 4px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .cite-source {
      font-size: 0.6875rem;
      color: var(--u-widget-text-secondary, #94a3b8);
      margin-top: 4px;
    }

    /* Compact mode */
    .citations[data-compact] .cite-item {
      padding: 6px 10px;
    }
    .citations[data-compact] .cite-snippet,
    .citations[data-compact] .cite-source { display: none; }

    @container u-citation (max-width: 20rem) {
      .cite-title { font-size: 0.8125rem; }
      .cite-snippet { font-size: 0.75rem; }
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
    const hasLink = Boolean(item.url);
    const displayUrl = item.url ? this._extractDomain(item.url) : undefined;

    return html`
      <div
        class="cite-item"
        part="cite-item"
        role="listitem"
        ?data-link=${hasLink}
        @click=${hasLink ? () => this._handleClick(item) : undefined}
      >
        ${numbered ? html`<span class="cite-num" part="cite-num">${index + 1}</span>` : nothing}
        <div class="cite-body">
          <div class="cite-title" part="cite-title">${item.title}</div>
          ${displayUrl ? html`<div class="cite-url" part="cite-url">${displayUrl}</div>` : nothing}
          ${item.snippet ? html`<div class="cite-snippet" part="cite-snippet">${item.snippet}</div>` : nothing}
          ${item.source ? html`<div class="cite-source" part="cite-source">${item.source}</div>` : nothing}
        </div>
      </div>
    `;
  }

  private _handleClick(item: CitationItem) {
    if (!item.url) return;

    // Sanitize URL — strip invisible chars and block dangerous protocols
    const safeUrl = item.url.replace(/[\s\u200B-\u200F\uFEFF\u00AD]/g, '');
    if (/^(javascript|data|vbscript):/i.test(safeUrl)) return;

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

    window.open(safeUrl, '_blank', 'noopener');
  }

  private _extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
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
    'u-citation': UCitation;
  }
}
