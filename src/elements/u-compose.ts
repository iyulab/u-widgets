import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetChildSpec } from '../core/types.js';

@customElement('u-compose')
export class UCompose extends LitElement {
  static styles = css`
    :host {
      display: block;
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
  `;

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  render() {
    if (!this.spec) return nothing;

    const layout = this.spec.layout ?? 'stack';
    const columns = this.spec.columns ?? 2;
    const children = this.spec.children ?? [];
    const title = this.spec.title;
    const items = children.map((c: UWidgetChildSpec) => this._child(c));

    if (layout === 'row') {
      return html`<div class="compose-container" part="compose">${title ? html`<div class="compose-title" part="title">${title}</div>` : nothing}<div class="layout-row" part="layout">${items}</div></div>`;
    }

    if (layout === 'grid') {
      return html`<div class="compose-container" part="compose">${title ? html`<div class="compose-title" part="title">${title}</div>` : nothing}<div class="layout-grid" part="layout" style="grid-template-columns: repeat(${columns}, 1fr)">${items}</div></div>`;
    }

    return html`<div class="compose-container" part="compose">${title ? html`<div class="compose-title" part="title">${title}</div>` : nothing}<div class="layout-stack" part="layout">${items}</div></div>`;
  }

  private _child(child: UWidgetChildSpec) {
    if (child.span) {
      return html`<div class="child" style="grid-column: span ${child.span}" part="child"><u-widget .spec=${child as UWidgetSpec}></u-widget></div>`;
    }
    return html`<div class="child" part="child"><u-widget .spec=${child as UWidgetSpec}></u-widget></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-compose': UCompose;
  }
}
