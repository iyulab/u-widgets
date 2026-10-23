import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { formatValue } from '../core/format.js';
import { meterStyles, readMeter, renderMeter, type Meter } from '../core/meter.js';
import { normalizeEmphasis, normalizeTone, toneLabel, toneStyles, TONE_GLYPHS, type Emphasis, type Tone } from '../core/tone.js';
import { themeStyles } from '../styles/tokens.js';

interface Reading {
  label: string;
  value: string;
  tone?: Tone;
}

interface Card {
  title: string;
  subtitle?: string;
  tone?: Tone;
  status?: string;
  emphasis?: Emphasis;
  image?: string;
  icon?: string;
  readings: Reading[];
  meter?: Meter;
  note?: string;
}

const OVERFLOWS = new Set(['clip', 'fade', 'scroll']);

/**
 * An image the card may show: a web address, a path, or an inline image (`data:image/…` — a drawn symbol). Script
 * schemes and other inline data are refused.
 */
function safeImage(src: unknown): string | undefined {
  if (typeof src !== 'string' || src === '') return undefined;
  const stripped = src.replace(/[\s​‌‍﻿­‎‏]/g, '');
  if (/^(javascript|vbscript):/i.test(stripped)) return undefined;
  if (/^data:/i.test(stripped) && !/^data:image\//i.test(stripped)) return undefined;
  return src;
}

function text(value: unknown): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

/**
 * <uw-status-card> — one asset or place: its name, its state, and a few readings.
 *
 * The state is a tone (`core/tone.ts`) — the card's stripe and badge take its colour and mark, the badge its words
 * (`status`, else the tone's name in the widget's locale) — with an optional `emphasis`. Readings are label · value
 * pairs, each value formatted (`format`, `unit`) and optionally toned; a `meter` draws a value against its range. An
 * `image` or `icon` is the card's picture. The card fits small boxes (from about 130px wide): the badge moves under
 * the name when both do not fit on a line, and narrow, the readings pack closer; what does not fit is clipped,
 * faded or scrolled (`options.overflow`).
 */
@customElement('uw-status-card')
export class UwStatusCard extends LitElement {
  static styles = [themeStyles, toneStyles, meterStyles, css`
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      color: var(--u-widget-text, #1a1a2e);
      container: uw-status-card / inline-size;
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
      padding: 10px 12px 10px 14px;
      border-left: 4px solid var(--tone, var(--u-widget-border, #e2e8f0));
      box-sizing: border-box;
      overflow: hidden;
    }

    /* The badge goes under the name when the two do not fit side by side — the name keeps room for a few words. */
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 6px 10px;
      flex: none;
    }

    .picture {
      flex: none;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      line-height: 1;
    }
    .picture img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* The picture stays beside the name; the two together wrap apart from the badge. */
    .ident {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex: 1 1 7em;
      min-width: 0;
    }
    .names {
      flex: 1 1 auto;
      min-width: 0;
    }
    .title {
      font-family: var(--u-widget-font-display);
      font-weight: 600;
      font-size: var(--u-widget-font-size, 0.875rem);
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    .subtitle {
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .badge {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 100%;
      box-sizing: border-box;
      padding: 2px 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--tone, var(--u-widget-text-secondary)) 14%, transparent);
      color: var(--tone, var(--u-widget-text-secondary));
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge .glyph { flex: none; }
    [data-emphasis='stamp'] .badge { display: none; }
    .card > .tone-stamp {
      position: absolute;
      right: 10px;
      bottom: 10px;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
    }

    .body {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow: hidden;
    }
    .card[data-overflow='scroll'] .body { overflow-y: auto; }
    .card[data-overflow='fade'] .body {
      -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent);
      mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent);
    }

    .readings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
      gap: 6px 12px;
      margin: 0;
    }
    .reading { min-width: 0; }
    .reading dt {
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .reading dd {
      margin: 0;
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      font-size: var(--u-widget-font-size, 0.875rem);
      overflow-wrap: anywhere;
    }
    .reading[data-tone] dd { color: var(--tone); }

    .note {
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    /* A small box: tighter, the picture shrinks, the readings stack. */
    @container uw-status-card (max-width: 180px) {
      .card { padding: 8px 8px 8px 10px; gap: 6px; }
      .picture { width: 28px; height: 28px; font-size: 1.1rem; }
      .readings { grid-template-columns: repeat(auto-fit, minmax(56px, 1fr)); gap: 4px 8px; }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    const card = this._card();
    if (!card) return nothing;
    const strings = localeStringsOf(this.spec);
    const status = card.status ?? (card.tone ? toneLabel(card.tone, strings) : undefined);
    const overflow = this.spec?.options?.overflow;
    return html`
      <div class="card" part="card" role="group" aria-label=${status ? `${card.title}: ${status}` : card.title}
        data-tone=${card.tone ?? nothing} data-emphasis=${card.emphasis ?? nothing}
        data-overflow=${typeof overflow === 'string' && OVERFLOWS.has(overflow) ? overflow : 'clip'}>
        <div class="head">
          <div class="ident">
          ${card.image
            ? html`<div class="picture" part="picture"><img src=${card.image} alt="" /></div>`
            : card.icon ? html`<div class="picture" part="picture" aria-hidden="true">${card.icon}</div>` : nothing}
          <div class="names">
            <div class="title" part="title">${card.title}</div>
            ${card.subtitle ? html`<div class="subtitle" part="subtitle">${card.subtitle}</div>` : nothing}
          </div>
          </div>
          ${status ? html`<span class="badge" part="badge">${card.tone ? html`<span class="glyph" aria-hidden="true">${TONE_GLYPHS[card.tone]}</span>` : nothing}${status}</span>` : nothing}
        </div>
        <div class="body">
          ${card.readings.length > 0 ? html`
            <dl class="readings" part="readings">
              ${card.readings.map(r => html`
                <div class="reading" part="reading" data-tone=${r.tone ?? nothing}>
                  <dt>${r.label}</dt><dd>${r.value}</dd>
                </div>`)}
            </dl>` : nothing}
          ${card.meter ? renderMeter(card.meter) : nothing}
          ${card.note ? html`<div class="note" part="note">${card.note}</div>` : nothing}
        </div>
        ${card.emphasis === 'stamp' && status ? html`<span class="tone-stamp" part="stamp">${status}</span>` : nothing}
      </div>
    `;
  }

  private _card(): Card | undefined {
    const data = this.spec?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
    const d = data as Record<string, unknown>;
    const title = text(d.title);
    if (!title) return undefined;
    const locale = typeof this.spec?.options?.locale === 'string' ? this.spec.options.locale : undefined;
    const value = (v: unknown, format?: unknown, unit?: unknown) =>
      `${typeof format === 'string' ? formatValue(v, format, locale) : v == null ? '—' : String(v)}${text(unit) ? ` ${unit}` : ''}`;
    const readings = (Array.isArray(d.readings) ? d.readings : [])
      .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object' && text((r as Record<string, unknown>).label) !== undefined)
      .map(r => ({
        label: String(r.label),
        value: value(r.value, r.format, r.unit),
        ...(r.tone != null && { tone: normalizeTone(r.tone, 'uw-status-card') }),
      }));
    const meter = readMeter(d.meter, value, 'uw-status-card');
    return {
      title,
      subtitle: text(d.subtitle),
      tone: normalizeTone(d.tone, 'uw-status-card'),
      status: text(d.status),
      emphasis: normalizeEmphasis(d.emphasis, 'uw-status-card'),
      image: safeImage(d.image),
      icon: text(d.icon),
      readings,
      meter,
      note: text(d.note),
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-status-card': UwStatusCard;
  }
}
