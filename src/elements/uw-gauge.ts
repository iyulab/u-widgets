import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

interface GaugeThreshold {
  to: number;
  color: string;
  label?: string;
}

interface GaugeOptions {
  min: number;
  max: number;
  unit: string;
  subtitle: string;
  thresholds: GaugeThreshold[];
}

const DEFAULT_GAUGE_OPTIONS: GaugeOptions = {
  min: 0,
  max: 100,
  unit: '',
  subtitle: '',
  thresholds: [],
};

const COLOR_MAP: Record<string, string> = {
  green: '#16a34a',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#dc2626',
  blue: '#2563eb',
  gray: '#6b7280',
};

function resolveColor(color: string): string {
  return COLOR_MAP[color] ?? color;
}

/** Width (viewBox units) the centre text may take — the inner span of the arc. */
const CENTER_TEXT_WIDTH = 130;

/**
 * Centre lines stacked around the arc centre (100,100), in viewBox units. Heights are each line's
 * font size × 1.2 at the default theme sizes, so the stack sits where the HTML overlay used to.
 */
const VALUE_LINE = 42;
const UNIT_LINE = 18;
const SUBTITLE_LINE = 20;

// SVG arc path helper
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

@customElement('uw-gauge')
export class UwGauge extends LitElement {
  static styles = [themeStyles, css`
    /* 세로 flex 인 이유: 아래 렌더 루트가 flex item 이어야 호스트 제약이 그것에 닿는다.
       200px 제약에서는 자연 높이 156px 이 작아 발동하지 않았고, 120px 에서 36px 가
       샜다 — 미측정은 통과가 아니었다.
       제약이 오면 계기판 «전체» 를 종횡비 그대로 줄인다(스크롤하지 않는다). 수치·단위·라벨이
       SVG 안의 <text> 라 호와 함께 같은 비율로 준다 — HTML 겹침이던 때는 호만 줄이면 1.75rem
       숫자가 호 밖으로 넘쳤을 것이다. ⚠크기 컨테이너(container-type: size)로 풀지 않는다:
       호스트에 높이를 주지 않은 일반 흐름에서 자기 높이를 잃고 0 으로 접힌다. 대신 아래 svg 가
       flex 로 줄어든다 — 제약이 없으면 줄 일이 없어 두 경우가 저절로 갈린다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-gauge / inline-size;
    }

    .gauge-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }

    /* width/height 속성(200×195)이 고유 크기·비율을 준다. 가로는 max-width 로, 세로는 flex 축소로
       제약을 받는다 — 퍼센트 max-height 는 호스트가 max-height 만 줬을 때 확정되지 않아 걸리지
       않았고(실측: 156px 그대로 56px 스크롤), flex 축소는 두 경우 모두 컨테이너의 실제 높이를
       따른다. 줄어든 상자 안에서 preserveAspectRatio(meet)가 비율을 지킨다. */
    .gauge-svg {
      display: block;
      flex: 0 1 auto;
      min-height: 0;
      width: auto;
      height: auto;
      max-width: min(100%, var(--u-widget-gauge-size, 160px));
    }

    .gauge-track {
      stroke: var(--u-widget-border, #e2e8f0);
    }

    /* 글자 크기는 viewBox 단위다. 기본 표시 폭 160px 에서 viewBox 200 이 0.8 배로 그려지므로
       ×1.25 를 걸어 종전 HTML 겹침과 같은 픽셀 크기(1.75rem · caption · overline)가 되게 한다. */
    .gauge-value {
      font-size: calc(1.75rem * 1.25);
      font-weight: 700;
      fill: var(--u-widget-text, #1a1a2e);
    }

    .gauge-unit {
      font-size: calc(var(--u-widget-font-size-caption, 0.75rem) * 1.25);
      fill: var(--u-widget-text-secondary, #5b6777);
    }

    .gauge-subtitle {
      font-size: calc(var(--u-widget-font-size-overline, 0.6875rem) * 1.25);
      font-weight: 600;
    }

    /* ── progress bar ── */
    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .progress-bar-track {
      width: 100%;
      height: 8px;
      background: var(--u-widget-border, #e2e8f0);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width var(--u-widget-duration-slow, 300ms) ease;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    /* 계기판 글자는 SVG 와 함께 줄므로 좁은 폭 규칙은 진행 막대에만 남는다. */
    @container uw-gauge (max-width: 10rem) {
      .progress-info {
        font-size: var(--u-widget-font-size-caption, 0.75rem);
      }

      .progress-bar-track {
        height: 6px;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    if (!this.spec?.data) return nothing;

    if (this.spec.widget === 'progress') {
      return this.renderProgress();
    }

    return this.renderGauge();
  }

  private getOptions(): GaugeOptions {
    const opts = (this.spec!.options ?? {}) as Partial<GaugeOptions>;
    return { ...DEFAULT_GAUGE_OPTIONS, ...opts };
  }

  private getValue(): number {
    const data = this.spec!.data as Record<string, unknown>;
    return Number(data.value ?? 0);
  }

  private getActiveLabel(value: number, opts: GaugeOptions): string {
    if (opts.subtitle) return opts.subtitle;
    if (!opts.thresholds?.length) return '';
    const sorted = [...opts.thresholds].sort((a, b) => a.to - b.to);
    for (const t of sorted) {
      if (value <= t.to && t.label) return t.label;
    }
    const last = sorted[sorted.length - 1];
    return last.label ?? '';
  }

  private renderGauge() {
    const opts = this.getOptions();
    const value = this.getValue();
    const range = opts.max - opts.min;
    const pct = range > 0 ? Math.max(0, Math.min(1, (value - opts.min) / range)) : 0;
    const color = this.getThresholdColor(value, opts);
    const activeLabel = this.getActiveLabel(value, opts);

    const cx = 100, cy = 100, r = 80;
    const startAngle = 150;
    const totalAngle = 240;
    const endAngle = startAngle + totalAngle * pct;

    const trackPath = describeArc(cx, cy, r, startAngle, startAngle + totalAngle);
    const fillPath = pct > 0 ? describeArc(cx, cy, r, startAngle, endAngle) : null;

    const label = typeof this.spec!.title === 'string' ? this.spec!.title : 'Gauge';
    const valueText = activeLabel ? `${value}${opts.unit} ${activeLabel}` : `${value}${opts.unit}`;

    const lines: { kind: 'value' | 'unit' | 'subtitle'; text: string; height: number }[] = [
      { kind: 'value', text: String(value), height: VALUE_LINE },
    ];
    if (opts.unit) lines.push({ kind: 'unit', text: opts.unit, height: UNIT_LINE });
    if (activeLabel) lines.push({ kind: 'subtitle', text: activeLabel, height: SUBTITLE_LINE });
    let top = cy - lines.reduce((sum, l) => sum + l.height, 0) / 2;
    const texts = lines.map((l) => {
      const y = top + l.height / 2;
      top += l.height;
      // The subtitle's text is written in updated(), which may shorten it — Lit owns no part inside it.
      return l.kind === 'subtitle'
        ? svg`<text class="gauge-subtitle" part="subtitle" x=${cx} y=${y} text-anchor="middle"
            dominant-baseline="central" fill=${color}></text>`
        : svg`<text class="gauge-${l.kind}" part=${l.kind} x=${cx} y=${y} text-anchor="middle"
            dominant-baseline="central">${l.text}</text>`;
    });
    this._subtitle = activeLabel;

    return html`
      <div class="gauge-container" part="gauge"
        role="meter"
        aria-valuenow=${value}
        aria-valuemin=${opts.min}
        aria-valuemax=${opts.max}
        aria-label=${label}
        aria-valuetext=${valueText}
      >
        <svg class="gauge-svg" width="200" height="195" viewBox="0 0 200 195" role="presentation" aria-hidden="true">
          <path class="gauge-track" d="${trackPath}" fill="none" stroke-width="12" stroke-linecap="round"></path>
          <path class="gauge-fill" d="${fillPath ?? 'M0 0'}" fill="none" stroke="${fillPath ? color : 'none'}" stroke-width="12" stroke-linecap="round"></path>
          ${texts}
        </svg>
      </div>
    `;
  }

  /** The gauge's centre label, written into its `<text>` after each render. */
  private _subtitle = '';

  /** SVG text has no text-overflow, so a label wider than the arc's inner span is cut with an ellipsis here. */
  protected updated() {
    const subtitle = this.renderRoot.querySelector<SVGTextElement>('text.gauge-subtitle');
    if (!subtitle) return;
    const full = this._subtitle;
    subtitle.textContent = full;
    if (typeof subtitle.getComputedTextLength !== 'function' || subtitle.getComputedTextLength() <= CENTER_TEXT_WIDTH) return;
    let lo = 0;
    let hi = full.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      subtitle.textContent = `${full.slice(0, mid)}…`;
      if (subtitle.getComputedTextLength() <= CENTER_TEXT_WIDTH) lo = mid;
      else hi = mid - 1;
    }
    subtitle.textContent = `${full.slice(0, lo).trimEnd()}…`;
  }

  private renderProgress() {
    const data = this.spec!.data as Record<string, unknown>;
    const value = Number(data.value ?? 0);
    const max = Number(data.max ?? (this.spec!.options as Record<string, unknown>)?.max ?? 100);
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const opts = this.getOptions();
    const color = this.getThresholdColor(value, opts);
    const label = this.formatLabel(value, pct);

    const ariaLabel = typeof this.spec!.title === 'string' ? this.spec!.title : 'Progress';

    return html`
      <div class="progress-container" part="progress"
        role="progressbar"
        aria-valuenow=${value}
        aria-valuemin=${0}
        aria-valuemax=${max}
        aria-label=${ariaLabel}
      >
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            style="width:${pct}%; background:${color || 'var(--u-widget-primary, #4f46e5)'}"
            part="progress-fill"
          ></div>
        </div>
        <div class="progress-info">
          <span>${label}</span>
          <span>${Math.round(pct)}%</span>
        </div>
      </div>
    `;
  }

  private formatLabel(value: number, pct: number): string {
    const opts = this.spec!.options as Record<string, unknown> | undefined;
    if (opts?.label) {
      return String(opts.label)
        .replace('{value}', String(value))
        .replace('{percent}', String(Math.round(pct)));
    }
    return String(value);
  }

  private getThresholdColor(value: number, opts: GaugeOptions): string {
    if (!opts.thresholds?.length) return 'var(--u-widget-primary, #4f46e5)';

    const sorted = [...opts.thresholds].sort((a, b) => a.to - b.to);
    for (const t of sorted) {
      if (value <= t.to) return resolveColor(t.color);
    }
    return resolveColor(sorted[sorted.length - 1].color);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-gauge': UwGauge;
  }
}
