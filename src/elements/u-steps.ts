import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

type StepStatus = 'done' | 'active' | 'pending' | 'error';

interface StepItem {
  label: string;
  status: StepStatus;
  description?: string;
  icon?: string;
}

const VALID_STATUSES = new Set(['done', 'active', 'pending', 'error']);

/** Returns an SVG icon or custom text icon for a step status. */
function statusIcon(status: StepStatus, iconOverride?: string): TemplateResult {
  if (iconOverride) return html`<span class="step-icon-text">${iconOverride}</span>`;
  switch (status) {
    case 'done':
      return html`<svg class="step-svg" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>`;
    case 'active':
      return html`<svg class="step-svg" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="5"/></svg>`;
    case 'pending':
      return html`<svg class="step-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5"/></svg>`;
    case 'error':
      return html`<svg class="step-svg" viewBox="0 0 16 16" fill="currentColor"><path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06Z"/></svg>`;
  }
}

/**
 * <u-steps> — Multi-step progress indicator widget.
 *
 * Renders a sequence of steps with status indicators.
 * Supports vertical and horizontal layouts, compact mode.
 */
@customElement('u-steps')
export class USteps extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-steps / inline-size;
    }

    /* ── Vertical Layout ── */
    .steps-vertical {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .step-v {
      display: flex;
      gap: 12px;
      min-height: 48px;
    }

    .step-v:last-child { min-height: auto; }

    .step-track {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 24px;
      flex-shrink: 0;
    }

    .step-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-svg { width: 14px; height: 14px; }
    .step-icon-text { font-size: 0.75rem; line-height: 1; }

    .step-line {
      width: 2px;
      flex: 1;
      min-height: 12px;
      background: var(--u-widget-border, #e2e8f0);
    }

    [data-status="pending"] .step-line {
      background: repeating-linear-gradient(
        to bottom,
        var(--u-widget-border, #e2e8f0) 0px,
        var(--u-widget-border, #e2e8f0) 3px,
        transparent 3px,
        transparent 6px
      );
    }

    .step-v:last-child .step-line { display: none; }

    .step-body {
      padding-bottom: 12px;
      flex: 1;
      min-width: 0;
    }

    .step-v:last-child .step-body { padding-bottom: 0; }

    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 24px;
    }

    .step-desc {
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
      margin-top: 2px;
      line-height: 1.4;
    }

    /* ── Horizontal Layout ── */
    .steps-horizontal {
      display: flex;
      align-items: flex-start;
    }

    .step-h {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 0;
      position: relative;
    }

    .step-h-top {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .step-h-line {
      flex: 1;
      height: 2px;
      background: var(--u-widget-border, #e2e8f0);
    }

    .step-h:first-child .step-h-line:first-child,
    .step-h:last-child .step-h-line:last-child {
      visibility: hidden;
    }

    .step-h-line[data-done] {
      background: var(--u-widget-positive, #16a34a);
    }

    .step-h-line:not([data-done]) {
      background: repeating-linear-gradient(
        to right,
        var(--u-widget-border, #e2e8f0) 0px,
        var(--u-widget-border, #e2e8f0) 3px,
        transparent 3px,
        transparent 6px
      );
    }

    .step-h .step-label {
      text-align: center;
      font-size: 0.75rem;
      line-height: 1.3;
      margin-top: 6px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Status Colors ── */
    [data-status="done"] .step-icon {
      background: var(--u-widget-positive, #16a34a);
      color: white;
    }
    [data-status="done"] .step-label {
      color: var(--u-widget-text, #1a1a2e);
    }
    [data-status="done"] .step-line {
      background: var(--u-widget-positive, #16a34a);
    }

    [data-status="active"] .step-icon {
      background: var(--u-widget-primary, #4f46e5);
      color: white;
    }
    [data-status="active"] .step-label {
      color: var(--u-widget-primary, #4f46e5);
      font-weight: 600;
    }

    [data-status="pending"] .step-icon {
      background: var(--u-widget-surface, #f1f5f9);
      color: var(--u-widget-text-secondary, #64748b);
    }
    [data-status="pending"] .step-label {
      color: var(--u-widget-text-secondary, #64748b);
    }

    [data-status="error"] .step-icon {
      background: var(--u-widget-negative, #dc2626);
      color: white;
    }
    [data-status="error"] .step-label {
      color: var(--u-widget-negative, #dc2626);
    }

    /* ── Compact Mode ── */
    .steps-vertical[data-compact] .step-v { min-height: 36px; }
    .steps-vertical[data-compact] .step-desc { display: none; }
    .steps-vertical[data-compact] .step-body { padding-bottom: 6px; }
    .steps-vertical[data-compact] .step-line { min-height: 6px; }

    .steps-horizontal[data-compact] .step-icon { width: 20px; height: 20px; font-size: 0.625rem; }
    .steps-horizontal[data-compact] .step-label { font-size: 0.6875rem; margin-top: 4px; }

    @container u-steps (max-width: 20rem) {
      .step-label { font-size: 0.8125rem; }
      .step-desc { font-size: 0.75rem; }

      /* horizontal → vertical auto-conversion on narrow containers */
      .steps-horizontal {
        flex-direction: column;
        align-items: stretch;
      }

      .step-h {
        flex-direction: row;
        align-items: flex-start;
        gap: 12px;
      }

      .step-h-top {
        flex-direction: column;
        width: 24px;
        flex-shrink: 0;
        align-items: center;
      }

      .step-h-line {
        width: 2px;
        height: auto;
        flex: 1;
        min-height: 12px;
      }

      .step-h:first-child .step-h-line:first-child,
      .step-h:last-child .step-h-line:last-child {
        display: none;
      }

      .step-h .step-label {
        text-align: left;
        white-space: normal;
        margin-top: 0;
        line-height: 24px;
        font-size: 0.8125rem;
      }
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
    const layout = String(options.layout ?? 'vertical');
    const compact = Boolean(options.compact ?? false);

    if (layout === 'horizontal') {
      return this._renderHorizontal(items, compact);
    }
    return this._renderVertical(items, compact);
  }

  private _renderVertical(items: StepItem[], compact: boolean) {
    return html`
      <div class="steps-vertical" part="steps" ?data-compact=${compact}
           role="list" aria-label=${this.spec?.title ?? 'Steps'}>
        ${items.map(item => html`
          <div class="step-v" part="step" role="listitem" data-status=${item.status}>
            <div class="step-track">
              <span class="step-icon" part="step-icon" aria-hidden="true">${statusIcon(item.status, item.icon)}</span>
              <div class="step-line"></div>
            </div>
            <div class="step-body">
              <div class="step-label" part="step-label">${item.label}</div>
              ${item.description ? html`<div class="step-desc" part="step-desc">${item.description}</div>` : nothing}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderHorizontal(items: StepItem[], compact: boolean) {
    return html`
      <div class="steps-horizontal" part="steps" ?data-compact=${compact}
           role="list" aria-label=${this.spec?.title ?? 'Steps'}>
        ${items.map((item, i) => {
          const prevDone = i > 0 && items[i - 1].status === 'done';
          const isDone = item.status === 'done';
          return html`
            <div class="step-h" part="step" role="listitem" data-status=${item.status}>
              <div class="step-h-top">
                <div class="step-h-line" ?data-done=${prevDone}></div>
                <span class="step-icon" part="step-icon" aria-hidden="true">${statusIcon(item.status, item.icon)}</span>
                <div class="step-h-line" ?data-done=${isDone}></div>
              </div>
              <div class="step-label" part="step-label">${item.label}</div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _extractItems(): StepItem[] {
    const data = this.spec?.data;
    if (!data || !Array.isArray(data)) return [];

    return data.filter((item): item is Record<string, unknown> =>
      item != null && typeof item === 'object' && 'label' in item,
    ).map(item => ({
      label: String(item.label),
      status: this._resolveStatus(item.status),
      description: item.description ? String(item.description) : undefined,
      icon: item.icon ? String(item.icon) : undefined,
    }));
  }

  private _resolveStatus(status: unknown): StepStatus {
    const s = String(status ?? 'pending');
    return VALID_STATUSES.has(s) ? s as StepStatus : 'pending';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-steps': USteps;
  }
}
