import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetAction, UWidgetEvent } from '../core/types.js';
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
import './u-kv.js';
import './u-code.js';
import './u-citation.js';
import './u-status.js';
import './u-steps.js';
import './u-rating.js';
import './u-video.js';
import './u-gallery.js';

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
        border: 1px solid var(--u-widget-negative, #ef4444);
        background: color-mix(in srgb, var(--u-widget-negative, #ef4444) 8%, var(--u-widget-bg, #fff));
        font-size: 0.8125rem;
      }

      .error-header { font-weight: 600; color: var(--u-widget-negative, #ef4444); margin-bottom: 4px; }
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

      .card-container {
        padding: 16px 20px;
        border-radius: var(--u-widget-radius, 6px);
        border: 1px solid var(--u-widget-border, #e2e8f0);
        background: var(--u-widget-bg, #fff);
        box-shadow: var(--u-widget-shadow);
        transition: box-shadow 0.2s;
      }

      /* ── shared action button styles ── */
      [part="widget-container"] {
        display: contents;
      }

      [part="action-btn"] {
        padding: 8px 20px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid var(--u-widget-border, #e2e8f0);
        background: var(--u-widget-bg, #fff);
        color: var(--u-widget-text, #1a1a2e);
        transition: all 0.15s;
        font-family: inherit;
      }

      [part="action-btn"]:hover {
        background: var(--u-widget-surface, #f1f5f9);
      }

      [part="action-btn"][data-style='primary'] {
        background: var(--u-widget-primary, #4f46e5);
        color: white;
        border-color: transparent;
      }

      [part="action-btn"][data-style='primary']:hover {
        opacity: 0.9;
      }

      [part="action-btn"][data-style='danger'] {
        background: var(--u-widget-negative, #dc2626);
        color: white;
        border-color: transparent;
      }

      [part="action-btn"]:disabled {
        opacity: 0.5;
        cursor: default;
      }

      /* ── global action bar ── */
      .global-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 10px;
        flex-wrap: wrap;
      }

      /* ── standalone actions widget ── */
      .actions-widget {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .actions-widget[data-layout='column'] {
        flex-direction: column;
      }

      /* ── divider widget ── */
      .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--u-widget-text-secondary, #64748b);
        font-size: 0.75rem;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-top: 1px solid var(--u-widget-border, #e2e8f0);
      }

      .divider:empty::after { display: none; }
      .divider:empty { border-top: 1px solid var(--u-widget-border, #e2e8f0); }
      .divider:empty::before { display: none; }

      .divider-spacing-small { margin: 4px 0; }
      .divider-spacing-default { margin: 12px 0; }
      .divider-spacing-large { margin: 24px 0; }

      /* ── header widget ── */
      .header-widget {
        font-weight: 600;
        color: var(--u-widget-text, #1a1a2e);
        margin: 0;
      }

      .header-widget[data-level='1'] { font-size: 1.5rem; }
      .header-widget[data-level='2'] { font-size: 1.25rem; }
      .header-widget[data-level='3'] { font-size: 1.1rem; }

      /* ── responsive: narrow container ── */
      @container u-widget (max-width: 20rem) {
        .global-actions {
          flex-direction: column;
        }

        .global-actions [part="action-btn"] {
          width: 100%;
          text-align: center;
        }

        .actions-widget:not([data-layout='column']) {
          flex-direction: column;
        }

        .actions-widget [part="action-btn"] {
          width: 100%;
          text-align: center;
        }

        .card-container {
          padding: 12px 14px;
        }

        [part="action-btn"] {
          padding: 8px 14px;
          font-size: 0.8125rem;
        }

        .header-widget[data-level='1'] { font-size: 1.25rem; }
        .header-widget[data-level='2'] { font-size: 1.1rem; }
        .header-widget[data-level='3'] { font-size: 1rem; }
      }
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

  /** Theme override: "dark" | "light" | null (auto via prefers-color-scheme). */
  @property({ type: String, reflect: true })
  theme: string | null = null;

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

    const t = this.theme;

    // Determine if actions should be rendered at router level
    // form/confirm handle their own actions; standalone "actions" widget also self-handles
    const selfHandlesActions = widget === 'form' || widget === 'confirm' || widget === 'actions';
    const globalActions = !selfHandlesActions ? (resolved.actions ?? []) : [];

    let widgetHtml;
    switch (widget) {
      case 'metric':
      case 'stat-group':
        widgetHtml = html`<u-metric .spec=${resolved} theme=${t ?? nothing}></u-metric>`;
        break;
      case 'gauge':
      case 'progress':
        widgetHtml = html`<u-gauge .spec=${resolved} theme=${t ?? nothing}></u-gauge>`;
        break;
      case 'table':
      case 'list':
        widgetHtml = html`<u-table .spec=${resolved} theme=${t ?? nothing}></u-table>`;
        break;
      case 'form':
      case 'confirm':
        widgetHtml = html`<u-form .spec=${resolved} theme=${t ?? nothing}></u-form>`;
        break;
      case 'compose':
        widgetHtml = html`<u-compose .spec=${resolved} theme=${t ?? nothing}></u-compose>`;
        break;
      case 'markdown':
      case 'image':
      case 'callout':
        widgetHtml = html`<u-content .spec=${resolved} theme=${t ?? nothing}></u-content>`;
        break;
      case 'kv':
        widgetHtml = html`<u-kv .spec=${resolved} theme=${t ?? nothing}></u-kv>`;
        break;
      case 'code':
        widgetHtml = html`<u-code .spec=${resolved} theme=${t ?? nothing}></u-code>`;
        break;
      case 'citation':
        widgetHtml = html`<u-citation .spec=${resolved} theme=${t ?? nothing}></u-citation>`;
        break;
      case 'status':
        widgetHtml = html`<u-status .spec=${resolved} theme=${t ?? nothing}></u-status>`;
        break;
      case 'steps':
        widgetHtml = html`<u-steps .spec=${resolved} theme=${t ?? nothing}></u-steps>`;
        break;
      case 'rating':
        widgetHtml = html`<u-rating .spec=${resolved} theme=${t ?? nothing}></u-rating>`;
        break;
      case 'video':
        widgetHtml = html`<u-video .spec=${resolved} theme=${t ?? nothing}></u-video>`;
        break;
      case 'gallery':
        widgetHtml = html`<u-gallery .spec=${resolved} theme=${t ?? nothing}></u-gallery>`;
        break;
      case 'actions':
        widgetHtml = this.renderActionsWidget(resolved);
        break;
      case 'divider':
        widgetHtml = this.renderDivider(resolved);
        break;
      case 'header':
        widgetHtml = this.renderHeader(resolved);
        break;
      default:
        // chart.* types are handled by u-chart if loaded (separate entry point)
        if (widget.startsWith('chart.') && customElements.get('u-chart')) {
          widgetHtml = html`<u-chart .spec=${resolved} theme=${t ?? nothing}></u-chart>`;
          break;
        }
        return this.renderFallback(resolved);
    }

    // Wrap in card container if options.card is set
    const isCard = Boolean((resolved.options as Record<string, unknown>)?.card);
    if (isCard) {
      widgetHtml = html`<div class="card-container" part="card">${widgetHtml}</div>`;
    }

    // Append global action bar if actions are present
    if (globalActions.length > 0) {
      const actionButtons = globalActions.map((a) => html`
        <button
          data-style=${a.style ?? 'default'}
          ?disabled=${a.disabled}
          @click=${() => this._dispatchAction(resolved, a)}
          part="action-btn"
        >${a.label}</button>
      `);
      return html`<div part="widget-container">${widgetHtml}<div class="global-actions" part="actions">${actionButtons}</div></div>`;
    }

    return widgetHtml;
  }

  /** Render standalone "actions" widget — a group of action buttons. */
  private renderActionsWidget(spec: UWidgetSpec) {
    const actions = spec.actions ?? [];
    if (actions.length === 0) return nothing;

    const options = (spec.options ?? {}) as Record<string, unknown>;
    const layout = String(options.layout ?? 'wrap');

    return html`
      <div class="actions-widget" data-layout=${layout} part="actions" role="group" aria-label=${spec.title ?? 'Actions'}>
        ${actions.map((a) => html`
          <button
            data-style=${a.style ?? 'default'}
            ?disabled=${a.disabled}
            @click=${() => this._dispatchAction(spec, a)}
            part="action-btn"
          >${a.label}</button>
        `)}
      </div>
    `;
  }

  /** Render inline divider widget. */
  private renderDivider(spec: UWidgetSpec) {
    const options = (spec.options ?? {}) as Record<string, unknown>;
    const label = options.label as string | undefined;
    const spacing = String(options.spacing ?? 'default');

    return html`
      <div class="divider divider-spacing-${spacing}" part="divider" role="separator">
        ${label ?? nothing}
      </div>
    `;
  }

  /** Render inline header widget. */
  private renderHeader(spec: UWidgetSpec) {
    const data = spec.data as Record<string, unknown> | undefined;
    const text = String(data?.text ?? spec.title ?? '');
    const level = String(data?.level ?? '2');

    if (!text) return nothing;

    return html`
      <div class="header-widget" data-level=${level} part="header" role="heading" aria-level=${level}>
        ${text}
      </div>
    `;
  }

  /** Dispatch an action event from the global action bar or actions widget. */
  private _dispatchAction(spec: UWidgetSpec, action: UWidgetAction) {
    if (action.action === 'navigate' && action.url) {
      window.open(action.url, '_blank', 'noopener');
      return;
    }

    this.dispatchEvent(
      new CustomEvent('u-widget-event', {
        detail: {
          type: 'action',
          widget: spec.widget,
          id: spec.id,
          action: action.action,
          data: action.url ? { url: action.url } : undefined,
        } satisfies UWidgetEvent,
        bubbles: true,
        composed: true,
      }),
    );
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
