import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';
import { formatValue } from '../core/format.js';
import { isTone, normalizeTone, type Tone } from '../core/tone.js';

interface GaugeThreshold {
  to: number;
  /** A colour — a name of `COLOR_MAP` or any CSS colour. */
  color?: string;
  /** A tone instead of a colour: the reading's state up to `to`. */
  tone?: Tone;
  label?: string;
}

/** A labelled point on the scale — a set level, a limit. */
interface GaugeMark {
  at: number;
  label?: string;
}

/** How the reading is drawn: an arc, or a level that rises — a column, a tank, a thermometer. */
const GAUGE_FORMS = ['arc', 'vertical', 'tank', 'thermometer'] as const;
type GaugeForm = (typeof GAUGE_FORMS)[number];

interface GaugeOptions {
  min: number;
  max: number;
  unit: string;
  subtitle: string;
  thresholds: GaugeThreshold[];
  form?: string;
  /** The acceptable band of the scale — drawn beside it. */
  band?: { lo?: number; hi?: number };
  marks?: GaugeMark[];
  /** Format hint for the shown value (`formatValue`) — default `number`, in the widget's locale. */
  format?: string;
  locale?: string;
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

/** The same for a level form, whose label runs across its whole width. */
const LEVEL_TEXT_WIDTH = 112;

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
      font-family: var(--u-widget-font-family);
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
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
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

    /* The band beside the scale is the acceptable range — in the ok tone; marks are the scale's own lines. */
    .gauge-band { stroke: var(--u-widget-tone-ok); fill: none; }
    .gauge-tick { stroke: var(--u-widget-text-secondary, #5b6777); stroke-width: 1.5; }
    .gauge-mark {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-size: 11px;
      fill: var(--u-widget-text-secondary, #5b6777);
    }

    /* A level form is drawn at its own size (120×200) — its text is in plain pixels. */
    .gauge-level-svg .gauge-subtitle { font-size: var(--u-widget-font-size-overline, 0.6875rem); }
    .gauge-level-value {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-size: 1.375rem;
      font-weight: 700;
      fill: var(--u-widget-text, #1a1a2e);
    }
    .gauge-level-unit {
      font-family: var(--u-widget-font-family);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      font-weight: 400;
      fill: var(--u-widget-text-secondary, #5b6777);
    }
    .gauge-tube { fill: var(--u-widget-border, #e2e8f0); }
    .gauge-vessel { fill: none; stroke: var(--u-widget-text-secondary, #5b6777); stroke-width: 2; }
    .gauge-level { opacity: 0.9; }

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

  /** The options, with the scale the data gives: a capacity or a floor is the source's value, so `data.min` and
   *  `data.max` win over `options.min` and `options.max` — in every form, as the progress bar already read it. */
  private getOptions(): GaugeOptions {
    const opts = (this.spec!.options ?? {}) as Partial<GaugeOptions>;
    const data = this.spec!.data as Record<string, unknown>;
    const scale: Partial<Pick<GaugeOptions, 'min' | 'max'>> = {};
    for (const end of ['min', 'max'] as const) {
      const given = data[end];
      if (given === null || given === undefined || given === '' || typeof given === 'boolean') continue;
      const n = Number(given);
      if (Number.isFinite(n)) scale[end] = n;
    }
    return { ...DEFAULT_GAUGE_OPTIONS, ...opts, ...scale };
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
    const fraction = (v: number) => (range > 0 ? Math.max(0, Math.min(1, (v - opts.min) / range)) : 0);
    const pct = fraction(value);
    const color = this.readingColor(value, opts);
    const activeLabel = this.getActiveLabel(value, opts);
    const label = typeof this.spec!.title === 'string' ? this.spec!.title : 'Gauge';
    const shown = this.formatShown(value, opts);
    const valueText = activeLabel ? `${shown}${opts.unit} ${activeLabel}` : `${shown}${opts.unit}`;
    const form: GaugeForm = (GAUGE_FORMS as readonly string[]).includes(opts.form ?? '') ? (opts.form as GaugeForm) : 'arc';
    const marks = (Array.isArray(opts.marks) ? opts.marks : [])
      .filter((m): m is GaugeMark => m != null && typeof m === 'object' && Number.isFinite(Number(m.at)))
      .map(m => ({ at: Number(m.at), label: m.label == null ? '' : String(m.label) }));
    const band = this.getBand(opts);
    this._subtitle = activeLabel;
    this._subtitleWidth = form === 'arc' ? CENTER_TEXT_WIDTH : LEVEL_TEXT_WIDTH;

    const body = form === 'arc'
      ? this.renderArc(pct, fraction, color, shown, opts.unit, activeLabel, band, marks)
      : this.renderLevel(form, pct, fraction, color, shown, opts.unit, activeLabel, band, marks);

    return html`
      <div class="gauge-container" part="gauge" data-form=${form}
        role="meter"
        aria-valuenow=${value}
        aria-valuemin=${opts.min}
        aria-valuemax=${opts.max}
        aria-label=${label}
        aria-valuetext=${valueText}
      >${body}</div>
    `;
  }

  /** The acceptable band, inside the scale — `lo` alone runs to the top, `hi` alone from the bottom. */
  private getBand(opts: GaugeOptions): { lo: number; hi: number } | undefined {
    const b = opts.band;
    if (!b || typeof b !== 'object' || (b.lo == null && b.hi == null)) return undefined;
    const lo = b.lo == null ? opts.min : Number(b.lo);
    const hi = b.hi == null ? opts.max : Number(b.hi);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return undefined;
    return { lo, hi };
  }

  private renderArc(
    pct: number,
    fraction: (v: number) => number,
    color: string,
    shown: string,
    unit: string,
    activeLabel: string,
    band: { lo: number; hi: number } | undefined,
    marks: { at: number; label: string }[],
  ) {
    const cx = 100, cy = 100, r = 80;
    const startAngle = 150;
    const totalAngle = 240;
    const angle = (f: number) => startAngle + totalAngle * f;

    const trackPath = describeArc(cx, cy, r, startAngle, startAngle + totalAngle);
    const fillPath = pct > 0 ? describeArc(cx, cy, r, startAngle, angle(pct)) : null;

    const lines: { kind: 'value' | 'unit' | 'subtitle'; text: string; height: number }[] = [
      { kind: 'value', text: shown, height: VALUE_LINE },
    ];
    if (unit) lines.push({ kind: 'unit', text: unit, height: UNIT_LINE });
    if (activeLabel) lines.push({ kind: 'subtitle', text: activeLabel, height: SUBTITLE_LINE });
    let top = cy - lines.reduce((sum, l) => sum + l.height, 0) / 2;
    const texts = lines.map((l) => {
      const y = top + l.height / 2;
      top += l.height;
      // The subtitle's text is written in updated(), which may shorten it — Lit owns no part inside it.
      return l.kind === 'subtitle'
        ? svg`<g class="gauge-subtitle-group"><title></title><text class="gauge-subtitle" part="subtitle" x=${cx} y=${y}
            text-anchor="middle" dominant-baseline="central" fill=${color}></text></g>`
        : svg`<text class="gauge-${l.kind}" part=${l.kind} x=${cx} y=${y} text-anchor="middle"
            dominant-baseline="central">${l.text}</text>`;
    });

    const at = (f: number, radius: number) => {
      const rad = ((angle(f) - 90) * Math.PI) / 180;
      return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)] as const;
    };
    const bandPath = band ? describeArc(cx, cy, r + 13, angle(fraction(band.lo)), angle(fraction(band.hi))) : null;
    const ticks = marks.map((m) => {
      const [x1, y1] = at(fraction(m.at), r - 8);
      const [x2, y2] = at(fraction(m.at), r + 8);
      const [lx, ly] = at(fraction(m.at), r + 24);
      return svg`<line class="gauge-tick" part="mark" x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>${m.label
        ? svg`<text class="gauge-mark" x=${lx} y=${ly} text-anchor="middle" dominant-baseline="central">${m.label}</text>`
        : nothing}`;
    });
    // Mark labels sit outside the arc — the drawing widens to hold them.
    const box = marks.some(m => m.label) ? { x: -18, y: -14, w: 236, h: 209 } : { x: 0, y: 0, w: 200, h: 195 };

    return html`
        <svg class="gauge-svg" width=${box.w} height=${box.h} viewBox="${box.x} ${box.y} ${box.w} ${box.h}" role="presentation" aria-hidden="true">
          <path class="gauge-track" d="${trackPath}" fill="none" stroke-width="12" stroke-linecap="round"></path>
          <path class="gauge-fill" d="${fillPath ?? 'M0 0'}" fill="none" stroke="${fillPath ? color : 'none'}" stroke-width="12" stroke-linecap="round"></path>
          ${bandPath ? svg`<path class="gauge-band" part="band" d=${bandPath} fill="none" stroke-width="4" stroke-linecap="round"></path>` : nothing}
          ${ticks}
          ${texts}
        </svg>`;
  }

  /**
   * A level that rises from the bottom of its scale — a column (`vertical`), a vessel (`tank`) or a tube over a bulb
   * (`thermometer`). The reading is written above it; the band runs beside it on the left, the marks on the right.
   */
  private renderLevel(
    form: Exclude<GaugeForm, 'arc'>,
    pct: number,
    fraction: (v: number) => number,
    color: string,
    shown: string,
    unit: string,
    activeLabel: string,
    band: { lo: number; hi: number } | undefined,
    marks: { at: number; label: string }[],
  ) {
    const W = 120, H = 200;
    const top = 54;
    const bottom = form === 'thermometer' ? 166 : 194;
    const cx = marks.length > 0 ? 46 : W / 2;
    const w = form === 'tank' ? 48 : form === 'thermometer' ? 12 : 22;
    const x0 = cx - w / 2;
    const y = (f: number) => bottom - f * (bottom - top);
    const level = y(pct);

    let shape;
    if (form === 'tank') {
      // The liquid inside the vessel's wall.
      const inset = 4;
      const inner = bottom - inset - pct * (bottom - top - inset * 2);
      shape = svg`
        <rect class="gauge-vessel" x=${x0} y=${top} width=${w} height=${bottom - top} rx="10"></rect>
        ${pct > 0 ? svg`<rect class="gauge-level" part="level" x=${x0 + inset} y=${inner} width=${w - inset * 2} height=${bottom - inset - inner} rx="6" fill=${color}></rect>` : nothing}`;
    } else if (form === 'thermometer') {
      const bulbY = bottom + 16;
      shape = svg`
        <rect class="gauge-tube" x=${x0} y=${top} width=${w} height=${bulbY - top} rx=${w / 2}></rect>
        <circle class="gauge-tube" cx=${cx} cy=${bulbY} r="14"></circle>
        <rect class="gauge-level" part="level" x=${x0 + 3} y=${level} width=${w - 6} height=${bulbY - level} rx=${(w - 6) / 2} fill=${color}></rect>
        <circle class="gauge-level" cx=${cx} cy=${bulbY} r="10" fill=${color}></circle>`;
    } else {
      shape = svg`
        <rect class="gauge-tube" x=${x0} y=${top} width=${w} height=${bottom - top} rx="4"></rect>
        ${pct > 0 ? svg`<rect class="gauge-level" part="level" x=${x0} y=${level} width=${w} height=${bottom - level} rx="4" fill=${color}></rect>` : nothing}`;
    }

    const bandLine = band
      ? svg`<line class="gauge-band" part="band" x1=${x0 - 8} x2=${x0 - 8} y1=${y(fraction(band.hi))} y2=${y(fraction(band.lo))} stroke-width="4" stroke-linecap="round"></line>`
      : nothing;
    const ticks = marks.map((m) => svg`
      <line class="gauge-tick" part="mark" x1=${x0 + w} x2=${x0 + w + 6} y1=${y(fraction(m.at))} y2=${y(fraction(m.at))}></line>
      ${m.label ? svg`<text class="gauge-mark" x=${x0 + w + 9} y=${y(fraction(m.at))} dominant-baseline="central">${m.label}</text>` : nothing}`);

    return html`
        <svg class="gauge-svg gauge-level-svg" width=${W} height=${H} viewBox="0 0 ${W} ${H}" role="presentation" aria-hidden="true">
          <text class="gauge-level-value" part="value" x=${W / 2} y="18" text-anchor="middle" dominant-baseline="central">${shown}${unit
            ? svg`<tspan class="gauge-level-unit" part="unit" dx="3">${unit}</tspan>`
            : nothing}</text>
          ${activeLabel ? svg`<g class="gauge-subtitle-group"><title></title><text class="gauge-subtitle" part="subtitle" x=${W / 2} y="40" text-anchor="middle" dominant-baseline="central" fill=${color}></text></g>` : nothing}
          ${shape}
          ${bandLine}
          ${ticks}
        </svg>`;
  }

  /** The gauge's centre label, written into its `<text>` after each render. */
  private _subtitle = '';

  /** How wide the label may be — the arc's inner span, or a level form's width. */
  private _subtitleWidth = CENTER_TEXT_WIDTH;

  private _resizeObserver?: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    // Measuring needs the label laid out in its real font. A gauge first rendered hidden measures 0, and
    // one rendered before a web font arrives measures the fallback — measure again once it is shown
    // (its size changes from nothing) and once the page's fonts are ready.
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(() => this._fitSubtitle());
      this._resizeObserver.observe(this);
    }
    document.fonts?.ready.then(() => this._fitSubtitle(), () => {});
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  protected updated() {
    this._fitSubtitle();
  }

  /**
   * SVG text has no text-overflow, so a label wider than the arc's inner span is cut with an ellipsis here. The cut
   * label's full text stays on the page: the group's `<title>` shows it on hover. (A screen reader reads it from the
   * meter's `aria-valuetext`, which always carries the whole label.)
   */
  private _fitSubtitle() {
    const subtitle = this.renderRoot.querySelector<SVGTextElement>('text.gauge-subtitle');
    if (!subtitle) return;
    const title = subtitle.parentElement?.querySelector(':scope > title');
    const full = this._subtitle;
    subtitle.textContent = full;
    if (title) title.textContent = '';
    if (typeof subtitle.getComputedTextLength !== 'function' || subtitle.getComputedTextLength() <= this._subtitleWidth) return;
    if (title) title.textContent = full;
    let lo = 0;
    let hi = full.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      subtitle.textContent = `${full.slice(0, mid)}…`;
      if (subtitle.getComputedTextLength() <= this._subtitleWidth) lo = mid;
      else hi = mid - 1;
    }
    subtitle.textContent = `${full.slice(0, lo).trimEnd()}…`;
  }

  private renderProgress() {
    const data = this.spec!.data as Record<string, unknown>;
    const value = Number(data.value ?? 0);
    const opts = this.getOptions();
    const max = opts.max;
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
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

  /** The value as shown — in the widget's locale (`79,17` on a German page), through `options.format` (default `number`). */
  private formatShown(value: number, opts: GaugeOptions): string {
    return formatValue(value, opts.format ?? 'number', typeof opts.locale === 'string' ? opts.locale : undefined);
  }

  private formatLabel(value: number, pct: number): string {
    const opts = this.getOptions();
    const shown = this.formatShown(value, opts);
    const template = (this.spec!.options as Record<string, unknown> | undefined)?.label;
    if (template) {
      return String(template)
        .replace('{value}', shown)
        .replace('{percent}', String(Math.round(pct)));
    }
    return shown;
  }

  /** The reading's colour: its own `tone` (`data.tone` — a state decided elsewhere), else the threshold it is under. */
  private readingColor(value: number, opts: GaugeOptions): string {
    const tone = normalizeTone((this.spec!.data as Record<string, unknown>).tone, 'uw-gauge');
    return tone ? `var(--u-widget-tone-${tone})` : this.getThresholdColor(value, opts);
  }

  private getThresholdColor(value: number, opts: GaugeOptions): string {
    if (!opts.thresholds?.length) return 'var(--u-widget-primary, #4f46e5)';

    const sorted = [...opts.thresholds].sort((a, b) => a.to - b.to);
    const step = sorted.find(t => value <= t.to) ?? sorted[sorted.length - 1];
    return isTone(step.tone) ? `var(--u-widget-tone-${step.tone})` : resolveColor(step.color ?? '');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-gauge': UwGauge;
  }
}
