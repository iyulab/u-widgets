import { css } from 'lit';
import { getLocaleStrings, type UWidgetLocaleStrings } from './locale.js';

/**
 * The tones a value's state is shown in — one vocabulary for every widget that colours by state.
 *
 * - `ok` · `watch` · `warn` · `alarm` — how far from normal: `watch` is the early sign before a warning.
 * - `info` — something to know, not a fault; its own colour, not the accent.
 * - `off` (switched off, not running) and `idle` (on, waiting for work) — both quiet, not alike.
 * - `accent` — picked out, with no judgement (the page's primary colour).
 * - `past` · `now` · `next` — where an item is in a sequence: a timeline, a queue, a schedule.
 *
 * An app's own state names (`cooking`, `boarding`, `free`) are mapped to these by the app; the tone is what a widget
 * draws.
 */
export const TONES = ['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'accent', 'past', 'now', 'next'] as const;

export type Tone = (typeof TONES)[number];

/** A second channel besides colour, for a state that must not be missed: the whole item inverted, hatched, stamped with its name, or blinking. */
export const EMPHASES = ['invert', 'hatch', 'stamp', 'blink'] as const;

export type Emphasis = (typeof EMPHASES)[number];

const TONE_SET = new Set<string>(TONES);
const EMPHASIS_SET = new Set<string>(EMPHASES);

/** The mark a tone shows beside its text, so a state reads by shape as well as colour. */
export const TONE_GLYPHS: Readonly<Record<Tone, string>> = {
  ok: '✓',     // ✓
  info: '●',   // ●
  watch: '◆',  // ◆
  warn: '▲',   // ▲
  alarm: '✕',  // ✕
  off: '–',    // –
  idle: '○',   // ○
  accent: '★', // ★
  past: '✓',   // ✓
  now: '▶',    // ▶
  next: '›',   // ›
};

export function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && TONE_SET.has(value);
}

export function isEmphasis(value: unknown): value is Emphasis {
  return typeof value === 'string' && EMPHASIS_SET.has(value);
}

const warned = new Set<string>();

/**
 * `value` as a tone, or `undefined` when there is none. A value that is not a tone warns once per widget and word,
 * naming the tones — a misspelt tone draws as no tone rather than as a wrong one.
 */
export function normalizeTone(value: unknown, widget: string): Tone | undefined {
  if (value == null || value === '') return undefined;
  if (isTone(value)) return value;
  const key = `${widget}:${String(value)}`;
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`[@iyulab/u-widgets] ${widget}: unknown tone "${String(value)}" — expected one of ${TONES.join(', ')}.`);
  }
  return undefined;
}

/** `value` as an emphasis, or `undefined` — an unknown word warns once per widget and word, like a tone. */
export function normalizeEmphasis(value: unknown, widget: string): Emphasis | undefined {
  if (value == null || value === '') return undefined;
  if (isEmphasis(value)) return value;
  const key = `${widget}:emphasis:${String(value)}`;
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`[@iyulab/u-widgets] ${widget}: unknown emphasis "${String(value)}" — expected one of ${EMPHASES.join(', ')}.`);
  }
  return undefined;
}

/**
 * The tone rules every state-coloured widget shares. An element carrying `data-tone` gets `--tone` (its colour) and
 * `--tone-on` (text on a fill of it); `data-emphasis` adds the second channel. A widget colours its parts with
 * `var(--tone)` rather than naming a tone itself.
 */
export const toneStyles = css`
  [data-tone='ok'] { --tone: var(--u-widget-tone-ok); }
  [data-tone='info'] { --tone: var(--u-widget-tone-info); }
  [data-tone='watch'] { --tone: var(--u-widget-tone-watch); }
  [data-tone='warn'] { --tone: var(--u-widget-tone-warn); }
  [data-tone='alarm'] { --tone: var(--u-widget-tone-alarm); }
  [data-tone='off'] { --tone: var(--u-widget-tone-off); }
  [data-tone='idle'] { --tone: var(--u-widget-tone-idle); }
  [data-tone='accent'] { --tone: var(--u-widget-tone-accent); }
  [data-tone='past'] { --tone: var(--u-widget-tone-past); }
  [data-tone='now'] { --tone: var(--u-widget-tone-now); }
  [data-tone='next'] { --tone: var(--u-widget-tone-next); }

  /* Inverted, the item is a fill of its tone and everything in it that is drawn in the tone takes the text colour. */
  [data-emphasis='invert'] {
    background: var(--tone, var(--u-widget-text));
    color: var(--u-widget-bg);
  }
  [data-emphasis='invert'] * {
    --tone: currentColor;
  }
  [data-emphasis='hatch'] {
    background-image: repeating-linear-gradient(
      -45deg,
      color-mix(in srgb, var(--tone, currentColor) 22%, transparent) 0 6px,
      transparent 6px 13px
    );
  }
  [data-emphasis='stamp'] .tone-stamp {
    display: inline-block;
  }
  .tone-stamp {
    display: none;
    padding: 1px 6px;
    border: 2px solid var(--tone, currentColor);
    border-radius: 3px;
    color: var(--tone, currentColor);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transform: rotate(-6deg);
  }
  [data-emphasis='blink'] {
    animation: uw-tone-blink 1.2s steps(2, start) infinite;
  }
  @keyframes uw-tone-blink {
    to { visibility: hidden; }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-emphasis='blink'] {
      animation: none;
      outline: 2px solid var(--tone, currentColor);
      outline-offset: 1px;
    }
  }
`;

const TONE_LABEL_KEYS = {
  ok: 'toneOk', info: 'toneInfo', watch: 'toneWatch', warn: 'toneWarn', alarm: 'toneAlarm', off: 'toneOff',
  idle: 'toneIdle', accent: 'toneAccent', past: 'tonePast', now: 'toneNow', next: 'toneNext',
} as const satisfies Record<Tone, keyof UWidgetLocaleStrings>;

/** A tone's name in a locale's strings (`localeStringsOf(spec)`, `getLocaleStrings('ko')`) — «정상», «Warning». */
export function toneLabel(tone: Tone, strings: UWidgetLocaleStrings = getLocaleStrings()): string {
  return strings[TONE_LABEL_KEYS[tone]];
}
