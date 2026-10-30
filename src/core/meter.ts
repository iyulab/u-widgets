import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { normalizeTone, type Tone } from './tone.js';

/** How a meter is drawn: a bar along the line, or a ring around its own centre. */
export const METER_FORMS = ['bar', 'ring'] as const;

export type MeterForm = (typeof METER_FORMS)[number];

/** A value against its range, read from a spec's `meter` object. */
export interface Meter {
  value: number;
  min: number;
  max: number;
  /** 0–1 along the range, clamped. */
  fraction: number;
  /** The value as written next to the meter — formatted, with its unit. */
  text: string;
  tone?: Tone;
  form: MeterForm;
  /**
   * The comparison value — a bar draws it as a mark across the track (a bullet graph: the value, and what it is
   * measured against). 0–1 along the range in `targetFraction`, written in `targetText`. A ring draws no mark.
   */
  target?: number;
  targetFraction?: number;
  targetText?: string;
}

/**
 * Reads `{ value, min?, max?, unit?, format?, tone?, form?, target? }` — min 0 and max 100 unless given. Anything that is not a
 * value inside a range (no number, max not above min) is no meter. `write` formats the value with the meter's `format`
 * and `unit`, the way the owning widget writes its other values.
 */
export function readMeter(
  raw: unknown,
  write: (value: number, format: unknown, unit: unknown) => string,
  widget: string,
): Meter | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const m = raw as Record<string, unknown>;
  if (m.value == null || m.value === '') return undefined;
  const value = Number(m.value);
  const min = m.min == null ? 0 : Number(m.min);
  const max = m.max == null ? 100 : Number(m.max);
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return undefined;
  const target = m.target == null || m.target === '' ? NaN : Number(m.target);
  return {
    value,
    min,
    max,
    fraction: Math.min(1, Math.max(0, (value - min) / (max - min))),
    text: write(value, m.format, m.unit),
    ...(m.tone != null && { tone: normalizeTone(m.tone, widget) }),
    form: m.form === 'ring' ? 'ring' : 'bar',
    ...(Number.isFinite(target) && withTarget({ value, min, max } as Meter, target, write(target, m.format, m.unit))),
  };
}

/** `target` on a meter: where it falls along the range, clamped, and how it is written. */
export function withTarget(meter: Pick<Meter, 'min' | 'max'>, target: number, text: string): Pick<Meter, 'target' | 'targetFraction' | 'targetText'> {
  return { target, targetFraction: Math.min(1, Math.max(0, (target - meter.min) / (meter.max - meter.min))), targetText: text };
}

// A circle of circumference 100 — the dash length is the percentage.
const RING_R = 15.9155;

/**
 * The meter, with its value written beside it. It is a `meter` to assistive technology — the range and the value, and
 * the written value as its text — and takes the colour of its tone (`data-tone`, from `toneStyles`), else the primary.
 * `fallbackTone` is the owner's tone, for a meter that has none of its own. `writeValue: false` leaves the value
 * unwritten beside it — for an owner that already shows that value; it is still the meter's text.
 */
export function renderMeter(meter: Meter, label?: string, fallbackTone?: Tone, writeValue = true, targetLabel?: (target: string) => string): TemplateResult {
  const tone = meter.tone ?? fallbackTone;
  const pct = meter.fraction * 100;
  const targetText = meter.targetText != null ? (targetLabel ? targetLabel(meter.targetText) : meter.targetText) : undefined;
  return html`
    <div class="meter" part="meter" data-form=${meter.form} data-tone=${tone ?? nothing}
      role="meter" aria-valuemin=${meter.min} aria-valuemax=${meter.max} aria-valuenow=${Math.min(meter.max, Math.max(meter.min, meter.value))}
      aria-valuetext=${targetText ? `${meter.text}, ${targetText}` : meter.text} aria-label=${label ?? nothing}>
      ${meter.form === 'ring'
        ? html`<svg class="meter-ring" viewBox="0 0 36 36" aria-hidden="true">${svg`
            <circle class="meter-ring-track" cx="18" cy="18" r=${RING_R}></circle>
            <circle class="meter-ring-fill" cx="18" cy="18" r=${RING_R} pathLength="100"
              stroke-dasharray="${pct.toFixed(1)} 100"></circle>`}</svg>`
        : html`<div class="meter-bar" aria-hidden="true">
            <div class="meter-track"><div class="meter-fill" style="width:${pct.toFixed(1)}%"></div></div>
            ${meter.targetFraction != null
              ? html`<div class="meter-target" part="meter-target" style="left:${(meter.targetFraction * 100).toFixed(1)}%" title=${targetText ?? nothing}></div>`
              : nothing}
          </div>`}
      ${writeValue ? html`<span class="meter-text" aria-hidden="true">${meter.text}</span>` : nothing}
    </div>`;
}

/** Styles for `renderMeter` — include them with `toneStyles`. */
export const meterStyles = css`
  .meter { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .meter-bar { position: relative; flex: 1 1 auto; min-width: 0; }
  .meter-track {
    height: 6px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--u-widget-text-secondary, #5b6777) 20%, transparent);
    overflow: hidden;
  }
  .meter-fill { height: 100%; background: var(--tone, var(--u-widget-primary, #4f46e5)); }
  /* The comparison mark — taller than the bar and in the text colour, so it reads against any tone (Few's bullet graph). */
  .meter-target {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    margin-left: -1px;
    background: var(--u-widget-text, #1a1a2e);
  }
  .meter-ring { flex: none; width: 2.25em; height: 2.25em; transform: rotate(-90deg); }
  .meter-ring circle { fill: none; stroke-width: 4; }
  .meter-ring-track { stroke: color-mix(in srgb, var(--u-widget-text-secondary, #5b6777) 20%, transparent); }
  .meter-ring-fill { stroke: var(--tone, var(--u-widget-primary, #4f46e5)); stroke-linecap: butt; }
  .meter-text {
    flex: none;
    font-family: var(--u-widget-font-numeric);
    font-variant-numeric: tabular-nums;
    font-size: var(--u-widget-font-size-caption, 0.75rem);
    color: var(--u-widget-text-secondary, #5b6777);
  }
`;
