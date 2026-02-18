import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

interface GaugeOptions {
  min: number;
  max: number;
  unit: string;
  thresholds: { to: number; color: string }[];
}

const DEFAULT_GAUGE_OPTIONS: GaugeOptions = {
  min: 0,
  max: 100,
  unit: '',
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

@customElement('u-gauge')
export class UGauge extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-gauge / inline-size;
    }

    .gauge-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .gauge-svg {
      width: 100%;
      max-width: var(--u-widget-gauge-size, 160px);
    }

    .gauge-track {
      stroke: var(--u-widget-border, #e2e8f0);
    }

    .gauge-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -10%);
      text-align: center;
    }

    .gauge-value {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--u-widget-text, #1a1a2e);
    }

    .gauge-unit {
      font-size: 0.75rem;
      color: var(--u-widget-text-secondary, #64748b);
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
      transition: width 0.3s ease;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    @container u-gauge (max-width: 10rem) {
      .gauge-value {
        font-size: 1.25rem;
      }

      .gauge-unit {
        font-size: 0.625rem;
      }

      .progress-info {
        font-size: 0.75rem;
      }

      .progress-bar-track {
        height: 6px;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

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

  private renderGauge() {
    const opts = this.getOptions();
    const value = this.getValue();
    const range = opts.max - opts.min;
    const pct = range > 0 ? Math.max(0, Math.min(1, (value - opts.min) / range)) : 0;
    const color = this.getThresholdColor(value, opts);

    const cx = 100, cy = 100, r = 80;
    const startAngle = 150;
    const totalAngle = 240;
    const endAngle = startAngle + totalAngle * pct;

    const trackPath = describeArc(cx, cy, r, startAngle, startAngle + totalAngle);
    const fillPath = pct > 0 ? describeArc(cx, cy, r, startAngle, endAngle) : null;

    const label = typeof this.spec!.title === 'string' ? this.spec!.title : 'Gauge';
    const valueText = `${value}${opts.unit}`;

    return html`
      <div class="gauge-container" part="gauge"
        role="meter"
        aria-valuenow=${value}
        aria-valuemin=${opts.min}
        aria-valuemax=${opts.max}
        aria-label=${label}
        aria-valuetext=${valueText}
      >
        <div class="gauge-center">
          <div class="gauge-value" part="value">${value}</div>
          ${opts.unit ? html`<div class="gauge-unit" part="unit">${opts.unit}</div>` : nothing}
        </div>
        <svg class="gauge-svg" viewBox="0 0 200 195" role="presentation" aria-hidden="true">
          <path class="gauge-track" d="${trackPath}" fill="none" stroke-width="12" stroke-linecap="round"></path>
          <path class="gauge-fill" d="${fillPath ?? ''}" fill="none" stroke="${fillPath ? color : 'transparent'}" stroke-width="12" stroke-linecap="round"></path>
        </svg>
      </div>
    `;
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
    'u-gauge': UGauge;
  }
}
