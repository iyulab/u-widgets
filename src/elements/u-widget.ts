import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetEvent } from '../core/types.js';
import { validate } from '../core/schema.js';
import { normalize } from '../core/normalize.js';
import { infer } from '../core/infer.js';
import './u-metric.js';
import './u-gauge.js';
import './u-table.js';
import './u-form.js';
import './u-compose.js';

/**
 * <u-widget> — Entry point router element.
 * Reads spec.widget and delegates to the appropriate sub-component.
 */
@customElement('u-widget')
export class UWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({
    type: Object,
    converter: {
      fromAttribute(value: string | null) {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
    },
  })
  spec: UWidgetSpec | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('u-widget-internal', this._handleInternalEvent as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('u-widget-internal', this._handleInternalEvent as EventListener);
  }

  private _handleInternalEvent = (e: CustomEvent<UWidgetEvent>) => {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('u-widget-event', {
        detail: e.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    if (!this.spec) {
      return html`<slot></slot>`;
    }

    const result = validate(this.spec);
    if (!result.valid) {
      return this.renderError(result.errors);
    }

    const spec = normalize(this.spec);
    return this.renderWidget(spec);
  }

  private renderWidget(spec: UWidgetSpec) {
    const widget = spec.widget;

    // Auto-infer mapping if missing
    const mapping = spec.mapping ?? infer(widget, spec.data);
    const resolved = mapping ? { ...spec, mapping } : spec;

    switch (widget) {
      case 'metric':
      case 'stat-group':
        return html`<u-metric .spec=${resolved}></u-metric>`;
      case 'gauge':
      case 'progress':
        return html`<u-gauge .spec=${resolved}></u-gauge>`;
      case 'table':
      case 'list':
        return html`<u-table .spec=${resolved}></u-table>`;
      case 'form':
      case 'confirm':
        return html`<u-form .spec=${resolved}></u-form>`;
      case 'compose':
        return html`<u-compose .spec=${resolved}></u-compose>`;
      default:
        // chart.* types are handled by u-chart if loaded (separate entry point)
        if (widget.startsWith('chart.') && customElements.get('u-chart')) {
          return html`<u-chart .spec=${resolved}></u-chart>`;
        }
        return this.renderFallback(resolved);
    }
  }

  private renderFallback(spec: UWidgetSpec) {
    return html`
      <div part="fallback">
        ${spec.title ? html`<div part="title">${spec.title}</div>` : null}
        <pre part="json"><code>${JSON.stringify(spec, null, 2)}</code></pre>
      </div>
    `;
  }

  private renderError(errors: string[]) {
    return html`
      <div part="error">
        ${errors.map((e) => html`<div>${e}</div>`)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-widget': UWidget;
  }
}
