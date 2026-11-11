import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { localeStringsOf } from '../core/locale.js';
import { formatValue, parseDateText } from '../core/format.js';
import { normalizeTone, toneLabel, toneMark, toneStyles, type Tone } from '../core/tone.js';
import { themeStyles } from '../styles/tokens.js';

interface Aside {
  label: string;
  value: string;
  tone?: Tone;
}

function text(value: unknown): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

/** A date-time written with an offset (`…T14:10:00+09:00`, `…Z`) — the only kind that names one moment for every viewer. */
const WITH_OFFSET = /[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * A date-time that carries an offset, written on the clock of `timeZone` (an IANA name) instead of the viewer's —
 * `undefined` when there is no zone, the text carries no offset (it is already a wall clock, written where it was made), or
 * the zone is not one.
 */
function inZone(value: unknown, parts: Intl.DateTimeFormatOptions, locale: string | undefined, timeZone: string | undefined): string | undefined {
  if (!timeZone || typeof value !== 'string' || !WITH_OFFSET.test(value.trim())) return undefined;
  const when = parseDateText(value);
  if (!when) return undefined;
  try {
    return new Intl.DateTimeFormat(locale, { ...parts, timeZone }).format(when);
  } catch {
    return undefined;
  }
}

/** How long before `now` a date-time was, in the words of `locale` ("now", "3 minutes ago", "2 hours ago", "yesterday"). */
function ago(value: unknown, locale: string | undefined, now: number): string | undefined {
  const when = typeof value === 'string' ? parseDateText(value) : null;
  if (!when) return undefined;
  // a time a little ahead of the viewer's clock is "now", not "in a few seconds"
  const seconds = Math.max(0, Math.floor((now - when.getTime()) / 1000));
  try {
    const words = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (seconds < 60) return words.format(0, 'second');
    if (seconds < 3600) return words.format(-Math.floor(seconds / 60), 'minute');
    if (seconds < 86_400) return words.format(-Math.floor(seconds / 3600), 'hour');
    return words.format(-Math.floor(seconds / 86_400), 'day');
  } catch {
    return undefined;
  }
}

/**
 * <uw-header> — a board's or a section's title block.
 *
 * The heading (`text`, at `level` 1–3) with what usually stands around it: a `kicker` above (a series, a site), a
 * `subtitle` under it, and on the other side the `date` and `time` it is for — or a running `clock` — and how long ago
 * (`since`, refreshed while on the page), a few `aside` label · value pairs, and the state of the whole as a `tone` with
 * its `status` words. A `date` or `time` that carries an offset is shown on `options.timeZone`'s clock when one is
 * given, else on the viewer's. Narrow, the far side wraps under the heading.
 */
@customElement('uw-header')
export class UwHeader extends LitElement {
  static styles = [themeStyles, toneStyles, css`
    :host {
      display: block;
      font-family: var(--u-widget-font-family);
      color: var(--u-widget-text, #1a1a2e);
    }

    .header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 6px 20px;
    }
    .main { min-width: 0; flex: 1 1 12em; }
    .kicker {
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      /* the host's --u-widget-kicker-color; the secondary text colour when unset */
      color: var(--u-widget-kicker-color, var(--u-widget-text-secondary, #5b6777));
    }
    .header-widget {
      font-family: var(--u-widget-font-display);
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
      margin: 0;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    /* the heading's size follows the host's --u-widget-title-scale (1 = as drawn) */
    .header-widget[data-level='1'] { font-size: calc(1.5rem * var(--u-widget-title-scale, 1)); }
    .header-widget[data-level='2'] { font-size: calc(1.25rem * var(--u-widget-title-scale, 1)); }
    .header-widget[data-level='3'] { font-size: calc(1.1rem * var(--u-widget-title-scale, 1)); }
    .subtitle {
      margin-top: 2px;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .side {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 6px 16px;
    }
    .when { text-align: end; margin-inline-start: auto; }
    .date {
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }
    .time {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.1;
    }
    .aside { min-width: 0; }
    .aside dt {
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }
    .aside dd {
      margin: 0;
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      font-size: var(--u-widget-font-size, 0.875rem);
    }
    .aside[data-tone] dd { color: var(--tone); }
    .asides { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--tone) 14%, transparent);
      color: var(--tone);
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      font-weight: 600;
      white-space: nowrap;
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  /** The time the clock shows and `since` is counted from, refreshed while the header is on the page. */
  @state() private _now = Date.now();
  private _timer?: ReturnType<typeof setInterval>;

  connectedCallback() {
    super.connectedCallback();
    this._syncClock();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer) clearInterval(this._timer);
    this._timer = undefined;
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('spec')) this._syncClock();
  }

  /** A clock, or a time since, ticks every 15 s — the minute it shows turns within that of the real one — and only while asked for. */
  private _syncClock() {
    const data = this._data();
    const wants = (data?.clock === true || text(data?.since) !== undefined) && this.isConnected;
    if (wants && !this._timer) {
      this._now = Date.now();
      this._timer = setInterval(() => { this._now = Date.now(); }, 15_000);
    } else if (!wants && this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  private _data(): Record<string, unknown> | undefined {
    const data = this.spec?.data;
    return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : undefined;
  }

  render() {
    const d = this._data() ?? {};
    const heading = text(d.text) ?? text(this.spec?.title);
    if (!heading) return nothing;
    const level = ['1', '2', '3'].includes(String(d.level)) ? String(d.level) : '2';
    const locale = typeof this.spec?.options?.locale === 'string' ? this.spec.options.locale : undefined;
    const tone = normalizeTone(d.tone, 'uw-header');
    const status = text(d.status) ?? (tone ? toneLabel(tone, localeStringsOf(this.spec)) : undefined);
    const zone = typeof this.spec?.options?.timeZone === 'string' && this.spec.options.timeZone ? this.spec.options.timeZone : undefined;
    const dateText = text(d.date) && (inZone(d.date, { year: 'numeric', month: '2-digit', day: '2-digit' }, locale, zone) ?? formatValue(d.date, 'date', locale));
    const timeText = d.clock === true
      ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(this._now)
      : text(d.time) && (inZone(d.time, { hour: '2-digit', minute: '2-digit' }, locale, zone)
        ?? (String(d.time).includes('T') ? formatValue(d.time, 'time', locale) : String(d.time)));
    const sinceText = text(d.since) && ago(d.since, locale, this._now);
    const asides: Aside[] = (Array.isArray(d.aside) ? d.aside : [])
      .filter((a): a is Record<string, unknown> => a != null && typeof a === 'object' && text((a as Record<string, unknown>).label) !== undefined)
      .map(a => ({
        label: String(a.label),
        value: `${typeof a.format === 'string' ? formatValue(a.value, a.format, locale) : a.value == null ? '—' : String(a.value)}${text(a.unit) ? ` ${a.unit}` : ''}`,
        ...(a.tone != null && { tone: normalizeTone(a.tone, 'uw-header') }),
      }));
    const hasSide = dateText || timeText || sinceText || asides.length > 0 || status;

    return html`
      <div class="header" part="header-block">
        <div class="main">
          ${text(d.kicker) ? html`<div class="kicker" part="kicker">${d.kicker}</div>` : nothing}
          <div class="header-widget" data-level=${level} part="header" role="heading" aria-level=${level}>${heading}</div>
          ${text(d.subtitle) ? html`<div class="subtitle" part="subtitle">${d.subtitle}</div>` : nothing}
        </div>
        ${hasSide ? html`
          <div class="side">
            ${asides.length > 0 ? html`<dl class="asides" part="aside">${asides.map(a => html`
              <div class="aside" data-tone=${a.tone ?? nothing}><dt>${a.label}</dt><dd>${a.value}</dd></div>`)}</dl>` : nothing}
            ${status ? html`<span class="status" part="status" data-tone=${tone ?? nothing}>${tone ? html`<span aria-hidden="true">${toneMark(tone, d.glyph)}</span>` : nothing}${status}</span>` : nothing}
            ${dateText || timeText || sinceText ? html`
              <div class="when" part="when">
                ${dateText ? html`<div class="date" part="date">${dateText}</div>` : nothing}
                ${timeText ? html`<div class="time" part="time" role=${d.clock === true ? 'timer' : nothing} aria-live="off">${timeText}</div>` : nothing}
                ${sinceText ? html`<div class="date since" part="since" aria-live="off">${sinceText}</div>` : nothing}
              </div>` : nothing}
          </div>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-header': UwHeader;
  }
}
