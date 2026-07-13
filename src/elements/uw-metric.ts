import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';
import { formatValue } from '../core/format.js';

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
  format?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const VALID_VARIANTS = new Set(['success', 'warning', 'danger', 'info', 'neutral']);
const warnedVariants = new Set<string>();

function normalizeVariant(variant: unknown): MetricData['variant'] {
  if (variant == null) return undefined;
  if (VALID_VARIANTS.has(variant as string)) return variant as MetricData['variant'];
  const key = String(variant);
  if (!warnedVariants.has(key)) {
    warnedVariants.add(key);
    console.warn(
      `[uw-metric] Unknown variant "${key}" — expected one of ${[...VALID_VARIANTS].join(', ')}. ` +
      `Falling back to default styling.`,
    );
  }
  return undefined;
}

function toMetricData(
  data: Record<string, unknown>,
  locale?: string,
  optionFormat?: string,
): MetricData {
  const rawValue = data.value as number | string;
  // 우선순위: 데이터 항목별 format > spec.options.format
  // (stat-group은 항목별 format이 자연스럽고, 단일 metric은 options.format이 자연스러움)
  const format = (data.format as string | undefined) ?? optionFormat;
  return {
    value: format ? formatValue(rawValue, format, locale) : (rawValue ?? 0),
    label: data.label as string | undefined,
    unit: data.unit as string | undefined,
    prefix: data.prefix as string | undefined,
    suffix: data.suffix as string | undefined,
    change: data.change as number | undefined,
    trend: data.trend as MetricData['trend'],
    icon: data.icon as string | undefined,
    description: data.description as string | undefined,
    format: data.format as string | undefined,
    variant: normalizeVariant(data.variant),
  };
}

@customElement('uw-metric')
export class UwMetric extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-metric / inline-size;
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
      /* 큰 수치(예: 통화 억/조 단위)가 천단위 그룹 중간에서 줄바꿈되면 가독성이 크게 떨어진다.
         한 줄 유지하고, 좁은 카드에서는 아래 container 쿼리로 폰트를 줄여 맞춘다. */
      white-space: nowrap;
    }

    @container uw-metric (max-width: 30rem) {
      .metric-value {
        font-size: 1.5rem;
      }
    }

    @container uw-metric (max-width: 16rem) {
      .metric-value {
        font-size: 1.25rem;
      }
    }

    @container uw-metric (max-width: 12rem) {
      .metric-value {
        font-size: 1.05rem;
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

    /* ── variant colors ── */
    .metric[data-variant="success"] .metric-value { color: var(--u-widget-positive, #16a34a); }
    .metric[data-variant="danger"] .metric-value { color: var(--u-widget-negative, #dc2626); }
    .metric[data-variant="warning"] .metric-value { color: var(--u-widget-warning, #d97706); }
    .metric[data-variant="info"]    .metric-value { color: var(--u-widget-primary, #4f46e5); }
    .metric[data-variant="neutral"] .metric-value { color: var(--u-widget-text-secondary, #64748b); }

    /* ── stat-group ── */
    /* 겹침 방지: 셀은 콘텐츠(max-content)보다 좁아질 수 없고, 넘치는 항목은 다음 행으로 wrap.
       셀 단위 container query 폰트 축소는 inline-size containment가 max-content 기여를 제거해
       콘텐츠 기반 사이징과 양립 불가 — wrap 방식 채택. */
    .stat-group-clip {
      /* 행 선두 셀의 구분선은 음수 margin으로 왼쪽 바깥에 놓이므로 여기서 클립 */
      overflow: hidden;
    }

    .stat-group {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1rem 1.5rem;
      /* 모든 셀이 구분선+패딩을 가지므로 행 선두 셀 몫을 왼쪽 바깥으로 밀어낸다 */
      margin-left: calc(-1.5rem - 1px);
    }

    .stat-group .metric {
      flex: 1 1 auto;
      /* 값보다 좁아지지 않게 — 겹침 대신 wrap. 위젯 전체보다 긴 극단값은 100%로 캡 */
      min-width: min(100%, max-content);
      border-left: 1px solid var(--u-widget-border, #e2e8f0);
      padding-left: 1.5rem;
    }

    @container uw-metric (max-width: 30rem) {
      .stat-group {
        flex-direction: column;
        gap: 1rem;
        margin-left: 0;
      }

      .stat-group .metric {
        flex: none;
        min-width: 0;
        border-left: none;
        padding-left: 0;
      }

      .stat-group .metric + .metric {
        border-top: 1px solid var(--u-widget-border, #e2e8f0);
        padding-top: 1rem;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    if (!this.spec?.data) return nothing;

    const locale = this.spec.options?.locale as string | undefined;
    const optionFormat = this.spec.options?.format as string | undefined;

    if (this.spec.widget === 'stat-group') {
      return this.renderStatGroup(locale, optionFormat);
    }

    return this.renderMetric(
      toMetricData(this.spec.data as Record<string, unknown>, locale, optionFormat),
    );
  }

  private renderStatGroup(locale?: string, optionFormat?: string) {
    const items = this.spec!.data as Record<string, unknown>[];
    if (!Array.isArray(items)) return nothing;

    return html`
      <div class="stat-group-clip">
        <div class="stat-group" part="stat-group">
          ${items.map((item) => this.renderMetric(toMetricData(item, locale, optionFormat)))}
        </div>
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
      <div class="metric" part="metric" aria-label=${ariaLabel ?? nothing} data-variant=${m.variant ?? nothing}>
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
    'uw-metric': UwMetric;
  }
}
