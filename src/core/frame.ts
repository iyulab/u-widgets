/**
 * The frames a widget can be drawn in — the panel around it, so a page need not draw one under it:
 *
 * - `card` — a surface with a border, the radius and the shadow tokens.
 * - `flat` — the surface alone, no border or shadow.
 * - `glow` — a card whose border and halo take the widget's tone (`data-tone`), or the accent.
 * - `plate` — a heavy rule with an inner hairline, like an engraved plate.
 * - `ticket` — scalloped top and bottom edges, like a torn ticket stub.
 * - `postage` — perforated all round, like a stamp.
 * - `tape` — a sheet stuck on slightly askew.
 *
 * Every frame reads the palette tokens — `--u-widget-bg` (the paper), `--u-widget-text` (the ink),
 * `--u-widget-border` (the rules) — so a page that sets them on the widget sets its frames too.
 */
export const FRAMES = ['card', 'flat', 'glow', 'plate', 'ticket', 'postage', 'tape'] as const;

export type Frame = (typeof FRAMES)[number];

const FRAME_SET = new Set<string>(FRAMES);

export function isFrame(value: unknown): value is Frame {
  return typeof value === 'string' && FRAME_SET.has(value);
}

const warned = new Set<string>();

/** `value` as a frame, or `undefined` — an unknown word warns once per widget and word, naming the frames. */
export function normalizeFrame(value: unknown, widget: string): Frame | undefined {
  if (value == null || value === '' || value === false) return undefined;
  if (isFrame(value)) return value;
  const key = `${widget}:${String(value)}`;
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`[@iyulab/u-widgets] ${widget}: unknown frame "${String(value)}" — expected one of ${FRAMES.join(', ')}.`);
  }
  return undefined;
}
