import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';
import { formatValue } from '../core/format.js';
import { meterStyles, readMeter, renderMeter, withTarget, type Meter } from '../core/meter.js';
import { localeStringsOf, formatTemplate } from '../core/locale.js';
import { normalizeEmphasis, normalizeTone, toneLabel, toneStyles, type Emphasis, type Tone } from '../core/tone.js';

interface MetricData {
  value: number | string;
  label?: string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  /** What a move up means — colours the change. Absent reads as `higher-better`, the look before it existed. */
  polarity?: Polarity;
  /** Written after `change` — `%` unless given (`pt`, `''` for an absolute amount). */
  changeUnit?: string;
  /** The comparison value, formatted like the value. */
  target?: string;
  icon?: string;
  note?: string;
  meter?: Meter;
  /** The value as given, before it is formatted. */
  raw?: unknown;
  format?: string;
  tone?: Tone;
  emphasis?: Emphasis;
  sparkline?: number[];
}

/**
 * The recent values under a figure as a small line, oldest first, scaled to their own range — the shape of the
 * last hours, not their size. Two values or more draw it; anything that is not a number is left out.
 */
function sparklinePaths(values: number[]): { line: string; area: string } | undefined {
  if (values.length < 2) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    // A flat run sits in the middle; otherwise the lowest value at the bottom and the highest at the top, inside
    // a margin so the stroke is not cut.
    const y = max === min ? 12 : 22 - ((v - min) / (max - min)) * 20;
    return `${round(x)},${round(y)}`;
  });
  return { line: `M${points.join('L')}`, area: `M0,24L${points.join('L')}L100,24Z` };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A meter of the figure itself (the same value) takes the metric's `target` when it has none of its own — the bar then
 * reads as a bullet graph: the value, and the mark it is measured against.
 */
function meterWithTarget(
  meter: Meter | undefined,
  data: Record<string, unknown>,
  write: (value: number, format: unknown, unit: unknown) => string,
): Meter | undefined {
  if (!meter || meter.target != null || meter.value !== Number(data.value)) return meter;
  const target = typeof data.target === 'number' ? data.target : NaN;
  if (!Number.isFinite(target)) return meter;
  const raw = data.meter as Record<string, unknown>;
  return { ...meter, ...withTarget(meter, target, write(target, raw.format, raw.unit)) };
}

const POLARITIES = ['higher-better', 'lower-better', 'neutral'] as const;
type Polarity = (typeof POLARITIES)[number];
const warnedPolarity = new Set<string>();

/** `value` as a polarity, or `undefined` — an unknown word warns once, like a tone. */
function normalizePolarity(value: unknown): Polarity | undefined {
  if (value == null || value === '') return undefined;
  if ((POLARITIES as readonly unknown[]).includes(value)) return value as Polarity;
  const word = String(value);
  if (!warnedPolarity.has(word)) {
    warnedPolarity.add(word);
    console.warn(`[@iyulab/u-widgets] uw-metric: unknown polarity "${word}" — expected one of ${POLARITIES.join(', ')}.`);
  }
  return undefined;
}

/**
 * Whether the change is good news. Direction (`trend`) and judgement are separate: a defect rate going up is bad.
 * `neutral` shows the direction without judging it; no polarity keeps the old reading (up is good).
 */
function changeSense(trend: MetricData['trend'], polarity: Polarity | undefined): 'good' | 'bad' | 'neutral' {
  if (trend !== 'up' && trend !== 'down') return 'neutral';
  if (polarity === 'neutral') return 'neutral';
  const up = polarity === 'lower-better' ? 'bad' : 'good';
  return trend === 'up' ? up : up === 'good' ? 'bad' : 'good';
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
  const write = (v: number, f: unknown, unit: unknown) =>
    `${typeof f === 'string' ? formatValue(v, f, locale) : String(v)}${typeof unit === 'string' && unit !== '' ? ` ${unit}` : ''}`;
  return {
    value: format ? formatValue(rawValue, format, locale) : (rawValue ?? 0),
    raw: rawValue,
    label: data.label as string | undefined,
    unit: data.unit as string | undefined,
    prefix: data.prefix as string | undefined,
    suffix: data.suffix as string | undefined,
    change: data.change as number | undefined,
    trend: data.trend as MetricData['trend'],
    polarity: normalizePolarity(data.polarity),
    changeUnit: typeof data.changeUnit === 'string' ? data.changeUnit : undefined,
    target:
      typeof data.target === 'number' || (typeof data.target === 'string' && data.target !== '')
        ? `${(data.prefix as string | undefined) ?? ''}${format ? formatValue(data.target, format, locale) : String(data.target)}${typeof data.unit === 'string' && data.unit !== '' ? ` ${data.unit}` : ''}${(data.suffix as string | undefined) ?? ''}`
        : undefined,
    icon: data.icon as string | undefined,
    note: typeof data.note === 'string' && data.note !== '' ? data.note : undefined,
    meter: meterWithTarget(readMeter(data.meter, write, 'uw-metric'), data, write),
    format: data.format as string | undefined,
    tone: normalizeTone(data.tone, 'uw-metric'),
    emphasis: normalizeEmphasis(data.emphasis, 'uw-metric'),
    sparkline: Array.isArray(data.sparkline)
      ? (data.sparkline as unknown[]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      : undefined,
  };
}

@customElement('uw-metric')
export class UwMetric extends LitElement {
  static styles = [themeStyles, toneStyles, meterStyles, css`
    /* 세로 flex 인 이유: 아래 렌더 루트(metric · stat-group)가 flex item 이어야 호스트 제약이
       그것에 닿는다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      container: uw-metric / inline-size;
    }

    /* ── metric (single) ── */
    .metric {
      display: flex;
      flex-direction: column;
      gap: 4px;
      /* A flex item of the host, so a height the host is given reaches it — and the sparkline below gives up its room
         first, rather than the card running past its box onto the next one. */
      min-height: 0;
    }

    .metric-value {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
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
      font-size: var(--u-widget-font-size, 0.875rem);
      font-weight: 400;
      color: var(--u-widget-text-secondary, #5b6777);
      margin-left: 4px;
    }

    .metric-change {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    /* Colour says good or bad news, not direction — the arrow says direction (polarity decides which is which). */
    .metric-change[data-sense='good'] {
      color: var(--u-widget-positive, #15803d);
    }

    .metric-change[data-sense='bad'] {
      color: var(--u-widget-negative, #dc2626);
    }

    .metric-change[data-sense='neutral'] {
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .metric-target {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .metric-label {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
      font-weight: 500;
    }

    .metric-icon { font-size: 1.25rem; line-height: 1; margin-bottom: 2px; }
    .metric-sparkline {
      display: block;
      width: 100%;
      height: 28px;
      flex: 0 1 28px;
      min-height: 0;
      margin-top: 4px;
      color: var(--u-widget-primary, #4f46e5);
      overflow: visible;
    }
    .metric-sparkline .line { fill: none; stroke: currentColor; stroke-width: 1.5; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
    .metric-sparkline .area { fill: currentColor; opacity: 0.14; }
    .metric[data-tone] .metric-sparkline { color: var(--tone); }

    .metric .meter { margin-top: 4px; }
    .metric-note { font-size: var(--u-widget-font-size-caption, 0.75rem); color: var(--u-widget-text-secondary, #5b6777); margin-top: 2px; line-height: 1.3; }

    /* ── tone (core/tone.ts) ── */
    .metric[data-tone] .metric-value { color: var(--tone); }

    /* ── stat-group ── */
    /* 겹침 방지: 셀은 콘텐츠(max-content)보다 좁아질 수 없고, 넘치는 항목은 다음 행으로 wrap.
       셀 단위 container query 폰트 축소는 inline-size containment가 max-content 기여를 제거해
       콘텐츠 기반 사이징과 양립 불가 — wrap 방식 채택. */
    .stat-group-clip {
      /* 🔴축을 «분리해서» 쓴다. 가로의 hidden 은 의도다 — 행 선두 셀의 구분선이 음수
         margin 으로 왼쪽 바깥에 놓이므로 그것을 클립한다. 세로는 그 의도와 무관하고, 항목이
         wrap 으로 여러 행이 되면 호스트 제약을 넘었다 ⇒ 세로만 스크롤로 연다.
         ⚠overflow hidden 축약으로 되돌리면 가로 의도는 지켜지지만 세로가 다시 «잘려서
         도달 불가» 가 된다. */
      overflow-x: hidden;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
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

  private renderSparkline(values: number[] | undefined) {
    const paths = values && sparklinePaths(values);
    if (!paths) return nothing;
    return html`<svg class="metric-sparkline" part="sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <path class="area" d=${paths.area}></path><path class="line" d=${paths.line}></path>
    </svg>`;
  }

  private renderMetric(m: MetricData) {
    const trendArrow =
      m.trend === 'up' ? '\u2191' : m.trend === 'down' ? '\u2193' : m.trend === 'flat' ? '\u2192' : '';

    const ariaLabel = m.label
      ? `${m.label}: ${m.prefix ?? ''}${m.value}${m.unit ?? ''}${m.suffix ?? ''}`
      : undefined;

    return html`
      <div class="metric" part="metric" aria-label=${ariaLabel ?? nothing} data-tone=${m.tone ?? nothing} data-emphasis=${m.emphasis ?? nothing}>
        ${m.icon ? html`<div class="metric-icon" part="icon">${m.icon}</div>` : nothing}
        ${m.label ? html`<div class="metric-label" part="label">${m.label}</div>` : nothing}
        <div class="metric-value" part="value">
          ${m.prefix ?? ''}${m.value}${m.unit ? html`<span class="metric-unit">${m.unit}</span>` : ''}${m.suffix ?? ''}
        </div>
        ${m.tone && m.emphasis === 'stamp' ? html`<span class="tone-stamp" part="stamp">${toneLabel(m.tone, localeStringsOf(this.spec))}</span>` : nothing}
        ${m.change != null
          ? html`<span class="metric-change" data-trend=${m.trend ?? 'flat'} data-sense=${changeSense(m.trend, m.polarity)} part="change"
              >${trendArrow} ${m.change > 0 ? '+' : ''}${m.change}${m.changeUnit ?? '%'}</span
            >`
          : nothing}
        ${m.target != null
          ? html`<div class="metric-target" part="target">${formatTemplate(localeStringsOf(this.spec).metricTarget, { target: m.target })}</div>`
          : nothing}
        ${m.meter ? renderMeter(m.meter, m.label, m.tone, m.meter.value !== Number(m.raw), (t) => formatTemplate(localeStringsOf(this.spec).metricTarget, { target: t })) : nothing}
        ${m.note ? html`<div class="metric-note" part="note">${m.note}</div>` : nothing}
        ${this.renderSparkline(m.sparkline)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-metric': UwMetric;
  }
}
