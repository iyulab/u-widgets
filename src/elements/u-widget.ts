import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetEvent } from '../core/types.js';
import { validate } from '../core/schema.js';
import { normalize } from '../core/normalize.js';
import { infer } from '../core/infer.js';
import { suggestWidget } from '../core/suggest.js';
import { themeStyles } from '../styles/tokens.js';
import './u-metric.js';
import './u-gauge.js';
import './u-table.js';
import './u-form.js';
import './u-compose.js';
import './u-content.js';

/**
 * <u-widget> — Entry point router element.
 * Reads spec.widget and delegates to the appropriate sub-component.
 *
 * Supports theme attribute: theme="dark" | theme="light" | (auto via prefers-color-scheme)
 */
@customElement('u-widget')
export class UWidget extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
        container: u-widget / inline-size;
      }

      .error-card {
        padding: 10px 14px;
        border-radius: 6px;
        border: 1px solid var(--u-widget-danger, #ef4444);
        background: #fef2f2;
        font-size: 0.8125rem;
      }
      :host([theme="dark"]) .error-card { background: #451a1a; }

      .error-header { font-weight: 600; color: var(--u-widget-danger, #ef4444); margin-bottom: 4px; }
      .error-list { margin: 0; padding-left: 20px; color: var(--u-widget-text-secondary, #64748b); }

      .fallback-card {
        padding: 10px 14px;
        border-radius: 6px;
        border: 1px dashed var(--u-widget-border, #e2e8f0);
        font-size: 0.8125rem;
      }
      .fallback-label { font-size: 0.6875rem; font-weight: 600; color: var(--u-widget-text-secondary, #64748b); margin-bottom: 6px; }
      .fallback-hint { font-size: 0.75rem; color: var(--u-widget-primary, #4f46e5); margin-bottom: 6px; }
      .fallback-card pre { margin: 0; white-space: pre-wrap; font-size: 0.75rem; color: var(--u-widget-text-secondary, #64748b); max-height: 200px; overflow-y: auto; }
    `,
  ];

  @property({
    type: Object,
    converter: {
      fromAttribute(value: string | null) {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn('[u-widget] Invalid JSON in spec attribute:', (e as Error).message);
          return null;
        }
      },
    },
  })
  spec: UWidgetSpec | null = null;

  /** Locale tag (e.g. 'ko', 'en-US'). Propagated to sub-components via spec.options.locale. */
  @property({ type: String, reflect: true })
  locale: string | null = null;

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
    let resolved = mapping ? { ...spec, mapping } : spec;

    // Propagate locale attribute to spec if not already set
    if (this.locale && !resolved.options?.locale) {
      resolved = {
        ...resolved,
        options: { ...resolved.options, locale: this.locale },
      };
    }

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
      case 'markdown':
      case 'image':
      case 'callout':
        return html`<u-content .spec=${resolved}></u-content>`;
      default:
        // chart.* types are handled by u-chart if loaded (separate entry point)
        if (widget.startsWith('chart.') && customElements.get('u-chart')) {
          return html`<u-chart .spec=${resolved}></u-chart>`;
        }
        return this.renderFallback(resolved);
    }
  }

  private renderFallback(spec: UWidgetSpec) {
    const suggestion = suggestWidget(spec.widget);
    return html`
      <div class="fallback-card" part="fallback">
        <div class="fallback-label">${spec.title ?? `Unknown widget: ${spec.widget}`}</div>
        ${suggestion ? html`<div class="fallback-hint">Did you mean <strong>${suggestion}</strong>?</div>` : ''}
        <pre part="json"><code>${JSON.stringify(spec, null, 2)}</code></pre>
      </div>
    `;
  }

  private renderError(errors: string[]) {
    return html`
      <div class="error-card" part="error">
        <div class="error-header">
          <span aria-hidden="true">&#x26A0;</span>
          <span>Invalid widget spec</span>
        </div>
        <ul class="error-list">
          ${errors.map((e) => html`<li>${e}</li>`)}
        </ul>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-widget': UWidget;
  }
}
