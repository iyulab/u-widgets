import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

interface MetricData {
  value: number | string;
  label?: string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  icon?: string;
  description?: string;
}

function toMetricData(data: Record<string, unknown>): MetricData {
  return {
    value: (data.value as number | string) ?? 0,
    label: data.label as string | undefined,
    unit: data.unit as string | undefined,
    prefix: data.prefix as string | undefined,
    suffix: data.suffix as string | undefined,
    change: data.change as number | undefined,
    trend: data.trend as MetricData['trend'],
    icon: data.icon as string | undefined,
    description: data.description as string | undefined,
  };
}

@customElement('u-metric')
export class UMetric extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-metric / inline-size;
    }

    /* ── metric (single) ── */
    .metric {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.1;
      color: var(--u-widget-text, #1a1a2e);
    }

    @container u-metric (max-width: 30rem) {
      .metric-value {
        font-size: 1.5rem;
      }
    }

    .metric-unit {
      font-size: 0.875rem;
      font-weight: 400;
      color: var(--u-widget-text-secondary, #64748b);
      margin-left: 4px;
    }

    .metric-change {
      font-size: 0.8125rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .metric-change[data-trend='up'] {
      color: var(--u-widget-positive, #16a34a);
    }

    .metric-change[data-trend='down'] {
      color: var(--u-widget-negative, #dc2626);
    }

    .metric-change[data-trend='flat'] {
      color: var(--u-widget-text-secondary, #64748b);
    }

    .metric-label {
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
      font-weight: 500;
    }

    .metric-icon { font-size: 1.25rem; line-height: 1; margin-bottom: 2px; }
    .metric-description { font-size: 0.75rem; color: var(--u-widget-text-secondary, #64748b); margin-top: 2px; line-height: 1.3; }

    /* ── stat-group ── */
    .stat-group {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .stat-group .metric {
      flex: 1;
      min-width: 100px;
    }

    .stat-group .metric + .metric {
      border-left: 1px solid var(--u-widget-border, #e2e8f0);
      padding-left: 1.5rem;
    }

    @container u-metric (max-width: 30rem) {
      .stat-group {
        flex-direction: column;
        gap: 1rem;
      }

      .stat-group .metric {
        flex: none;
        min-width: 0;
      }

      .stat-group .metric + .metric {
        border-left: none;
        padding-left: 0;
        border-top: 1px solid var(--u-widget-border, #e2e8f0);
        padding-top: 1rem;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  render() {
    if (!this.spec?.data) return nothing;

    if (this.spec.widget === 'stat-group') {
      return this.renderStatGroup();
    }

    return this.renderMetric(toMetricData(this.spec.data as Record<string, unknown>));
  }

  private renderStatGroup() {
    const items = this.spec!.data as Record<string, unknown>[];
    if (!Array.isArray(items)) return nothing;

    return html`
      <div class="stat-group" part="stat-group">
        ${items.map((item) => this.renderMetric(toMetricData(item)))}
      </div>
    `;
  }

  private renderMetric(m: MetricData) {
    const trendArrow =
      m.trend === 'up' ? '\u2191' : m.trend === 'down' ? '\u2193' : m.trend === 'flat' ? '\u2192' : '';

    const ariaLabel = m.label
      ? `${m.label}: ${m.prefix ?? ''}${m.value}${m.unit ?? ''}${m.suffix ?? ''}`
      : undefined;

    return html`
      <div class="metric" part="metric" aria-label=${ariaLabel ?? nothing}>
        ${m.icon ? html`<div class="metric-icon" part="icon">${m.icon}</div>` : nothing}
        ${m.label ? html`<div class="metric-label" part="label">${m.label}</div>` : nothing}
        <div class="metric-value" part="value">
          ${m.prefix ?? ''}${m.value}${m.unit ? html`<span class="metric-unit">${m.unit}</span>` : ''}${m.suffix ?? ''}
        </div>
        ${m.change != null
          ? html`<span class="metric-change" data-trend=${m.trend ?? 'flat'} part="change"
              >${trendArrow} ${m.change > 0 ? '+' : ''}${m.change}%</span
            >`
          : nothing}
        ${m.description ? html`<div class="metric-description" part="description">${m.description}</div>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-metric': UMetric;
  }
}
