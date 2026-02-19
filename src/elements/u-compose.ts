import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetChildSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

@customElement('u-compose')
export class UCompose extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      container: u-compose / inline-size;
    }

    .compose-container {
      display: flex;
      flex-direction: column;
    }

    .compose-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
      margin-bottom: 12px;
    }

    .layout-stack {
      display: flex;
      flex-direction: column;
      gap: var(--u-widget-gap, 16px);
    }

    .layout-row {
      display: flex;
      flex-direction: row;
      gap: var(--u-widget-gap, 16px);
    }

    .layout-row > * {
      flex: 1;
      min-width: 0;
    }

    .layout-grid {
      display: grid;
      gap: var(--u-widget-gap, 16px);
    }

    .child-card {
      padding: 16px 20px;
      border-radius: var(--u-widget-radius, 6px);
      border: 1px solid var(--u-widget-border, #e2e8f0);
      background: var(--u-widget-bg, #fff);
      box-shadow: var(--u-widget-shadow);
      transition: box-shadow 0.2s;
    }

    /* ── collapsed child (details/summary) ── */
    details.child-collapsed {
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 6px;
      overflow: hidden;
    }

    details.child-collapsed > summary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--u-widget-text, #1a1a2e);
      cursor: pointer;
      user-select: none;
      list-style: none;
      background: var(--u-widget-surface, #f1f5f9);
    }

    details.child-collapsed > summary::-webkit-details-marker { display: none; }

    details.child-collapsed > summary::before {
      content: '\\25B6';
      font-size: 0.625rem;
      transition: transform 0.15s;
    }

    details.child-collapsed[open] > summary::before {
      transform: rotate(90deg);
    }

    details.child-collapsed > .collapsed-content {
      padding: 12px;
    }

    /* ── container-query responsive ── */
    @container u-compose (max-width: 30rem) {
      .layout-row {
        flex-direction: column;
      }

      .layout-grid {
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

    const layout = this.spec.layout ?? 'stack';
    const columns = this.spec.columns ?? 2;
    const children = this.spec.children ?? [];
    const title = this.spec.title;
    const items = children.map((c: UWidgetChildSpec) => this._child(c));

    const roleAttr = title ? 'region' : undefined;

    if (layout === 'row') {
      return html`<div class="compose-container" part="compose" role=${roleAttr ?? nothing} aria-label=${title ?? nothing}>${title ? html`<div class="compose-title" part="title">${title}</div>` : nothing}<div class="layout-row" part="layout">${items}</div></div>`;
    }

    if (layout === 'grid') {
      const gridCols = this._gridColumns(columns);
      return html`<div class="compose-container" part="compose" role=${roleAttr ?? nothing} aria-label=${title ?? nothing}>${title ? html`<div class="compose-title" part="title">${title}</div>` : nothing}<div class="layout-grid" part="layout" style="grid-template-columns: ${gridCols}">${items}</div></div>`;
    }

    return html`<div class="compose-container" part="compose" role=${roleAttr ?? nothing} aria-label=${title ?? nothing}>${title ? html`<div class="compose-title" part="title">${title}</div>` : nothing}<div class="layout-stack" part="layout">${items}</div></div>`;
  }

  /** Compute grid-template-columns from options.widths or fallback to equal columns. */
  private _gridColumns(columns: number): string {
    const options = (this.spec?.options ?? {}) as Record<string, unknown>;
    const widths = options.widths;

    if (!Array.isArray(widths) || widths.length === 0) {
      return `repeat(${columns}, 1fr)`;
    }

    return widths.map((w: unknown) => {
      if (w === 'auto') return 'auto';
      if (w === 'stretch') return '1fr';
      const n = Number(w);
      if (Number.isFinite(n) && n > 0) return `${n}fr`;
      return '1fr'; // fallback
    }).join(' ');
  }

  private _child(child: UWidgetChildSpec) {
    const t = this.theme;
    const span = child.span ? Math.max(1, Math.floor(Number(child.span) || 1)) : 0;
    const spanStyle = span > 1 ? `grid-column: span ${span}` : '';
    const options = (this.spec?.options ?? {}) as Record<string, unknown>;
    const isCard = Boolean(options.card);

    const widgetHtml = html`<u-widget .spec=${child as UWidgetSpec} theme=${t ?? nothing}></u-widget>`;

    // Collapsed child: wrap in <details>/<summary>
    if (child.collapsed) {
      const summary = child.title || 'Details';
      return html`
        <details class="child-collapsed" part="child" style=${spanStyle || nothing}>
          <summary part="collapsed-summary">${summary}</summary>
          <div class="collapsed-content">${widgetHtml}</div>
        </details>
      `;
    }

    const cls = isCard ? 'child child-card' : 'child';
    if (spanStyle) {
      return html`<div class=${cls} style=${spanStyle} part="child">${widgetHtml}</div>`;
    }
    return html`<div class=${cls} part="child">${widgetHtml}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-compose': UCompose;
  }
}
