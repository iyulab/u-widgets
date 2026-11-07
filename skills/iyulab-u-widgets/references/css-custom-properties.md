# CSS Custom Properties

Every `u-widget`/`uw-*` element shares one token sheet (`styles/tokens.ts`, applied via `:host`).
Override any of them by styling the element directly:

> 🔴**Style the element, not `:root`.** A custom property set on `:root` reaches a widget as an
> *inherited* value, and an inherited value never beats a declaration on the element itself —
> which is exactly what the token sheet writes (`:host { --u-widget-*: … }`). Measured in
> chromium: a `:root` override leaves every default in place, with no error. Use a tag
> selector (`u-widget { … }`), or a tag list wrapped in `:where()` if you want a preset that
> an application can still override — `:where()` keeps specificity at 0 and *still* wins over
> `:host`, because the shadow cascade decides "outer tree beats inner tree" before it ever
> compares specificity.

```css
u-widget {
  --u-widget-primary: #7c3aed;
  --u-widget-radius: 10px;
}
```

Dark mode is automatic — `:host` sets `color-scheme: light dark` and the dark values below apply
via `@media (prefers-color-scheme: dark)`, unless a `theme="dark"`/`theme="light"` attribute forces
one mode. `light-dark()` is deliberately **not** used for color tokens: `getComputedStyle().
getPropertyValue()` returns the raw function string instead of the resolved color, which would
break imperative consumers like ECharts that read tokens at runtime (`uw-chart`'s
`_readCSSVar`).

## Ready-made theme sheets

Two optional sheets ship with the package. Both are opt-in: import neither and the defaults
below apply unchanged, which is what keeps the package usable standalone.

```js
import '@iyulab/u-widgets/themes/components.css';  // follow @iyulab/components' tokens
import '@iyulab/u-widgets/themes/shadcn.css';      // follow Shadcn/ui + Tailwind v4
```

`themes/components.css` is a **bridge, not a copy**: every declaration reads
`var(<the other package's token>, <the default below>)`, so the widgets follow that sheet as it
changes, and fall back to their own defaults when it is not loaded. It maps the chart palette slot
for slot (`--u-chart-color-1…8`) and the four font sizes to the steps of the same names
(`--u-text-body-size`, `-label-`, `-caption-`, `-overline-`) — so a page that rescales its type, a
large-text wall display, rescales the widgets and their charts with it.

## Colors

| Property | Light | Dark |
|----------|-------|------|
| `--u-widget-bg` | `#fff` | `#1e1e2e` |
| `--u-widget-surface` | `#f1f5f9` | `#2a2a3e` |
| `--u-widget-text` | `#1a1a2e` | `#e2e8f0` |
| `--u-widget-text-secondary` | `#5b6777` | `#94a3b8` |
| `--u-widget-border` | `#e2e8f0` | `#374151` |
| `--u-widget-primary` | `#4f46e5` | `#818cf8` |
| `--u-widget-positive` | `#15803d` | `#4ade80` |
| `--u-widget-negative` | `#dc2626` | `#f87171` |
| `--u-widget-on-primary` | `#ffffff` | `#1e1e2e` |
| `--u-widget-on-negative` | `#ffffff` | `#1e1e2e` |
| `--u-widget-on-positive` | `#ffffff` | `#1e1e2e` |

`on-*` tokens are the text/icon color used *on top of* the matching filled surface (e.g.
`on-primary` on a `--u-widget-primary` button) — they flip per theme rather than staying a fixed
white, so contrast holds in both.

## Chart Palette

`--u-widget-chart-color-1` through `-8`, read at runtime by `uw-chart` (`getComputedStyle`, not a
static `var()` in a stylesheet — this is why it's a numbered sequence rather than named slots).

| # | Light | Dark |
|---|-------|------|
| 1 | `#4f46e5` | `#818cf8` |
| 2 | `#0ea5e9` | `#38bdf8` |
| 3 | `#10b981` | `#34d399` |
| 4 | `#f59e0b` | `#fbbf24` |
| 5 | `#ef4444` | `#f87171` |
| 6 | `#8b5cf6` | `#a78bfa` |
| 7 | `#ec4899` | `#f472b6` |
| 8 | `#06b6d4` | `#22d3ee` |

## Spacing & Shape

| Property | Value | Description |
|----------|-------|--------------|
| `--u-widget-gap` | `16px` | Default gap between stacked/grid elements |
| `--u-widget-radius` | `6px` | Corner radius (cards, buttons) |

## Typography

| Property | Value | Description |
|----------|-------|--------------|
| `--u-widget-font-family` | `system-ui, -apple-system, sans-serif` | Base font stack |
| `--u-widget-font-mono` | `ui-monospace, 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace` | Monospace stack (code, inline code) |
| `--u-widget-font-size` | `0.875rem` | Body tier |
| `--u-widget-font-size-label` | `0.8125rem` | Label tier |
| `--u-widget-font-size-caption` | `0.75rem` | Caption tier |
| `--u-widget-font-size-overline` | `0.6875rem` | Overline tier |

Kept local to this package rather than referencing `@iyulab/components`' `--u-text-*` tokens,
since `u-widgets` is designed to be usable standalone without that package installed (the
`themes/components.css` bridge connects them). A chart draws its axis labels and its own text at
the caption size and its legend at the label size, read when it draws — set those tokens and the
canvas text follows; the compact layout of a small chart keeps its own smaller sizes.

## Chart Size

| Property | Value | Description |
|----------|-------|--------------|
| `--u-widget-chart-height` | `300px` | `uw-chart` height **when nothing constrains the host** |

This is a default, not a cap. Give the host element a `height` or `max-height` and the chart follows
that instead — the token only decides how tall the chart is when the host is free to grow.

## Shadow

| Property | Light | Dark |
|----------|-------|------|
| `--u-widget-shadow` | `0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)` | `0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)` |

## Per-widget sizing (not in the shared sheet)

These two have no declared default in `tokens.ts` — they're consumed with an inline fallback in
the element that uses them, so they only take effect on that specific tag:

| Property | Default | Used by |
|----------|---------|---------|
| `--u-widget-chart-height-narrow` | `200px` | `uw-chart` (inside a `max-width: 20rem` container query) |
| `--u-widget-gauge-size` | `160px` | `uw-gauge` (`max-width`) |

## Type and title knobs a host may set (none declared)

These are read with a fallback and **declared nowhere** — a host that sets nothing gets every widget exactly as drawn
before. Set them on the widget, a wrapper or `:root` (they inherit into the shadow tree).

| Property | Default | Effect |
|----------|---------|--------|
| `--u-widget-figure-scale` | `1` | Multiplies the size of the headline figure of `metric` and `stat-group`, at every width it is drawn in |
| `--u-widget-figure-weight` | `700` | Font weight of that figure |
| `--u-widget-value-scale` | `1` | Multiplies the size of a value: a `status-card` reading, a `list` row's trailing value and time, a `kv` value, a `table` row's trailing value |
| `--u-widget-value-weight` | `600` (`status-card`, `kv`) · `500` (`list` trailing value) · inherited (`table` row) | Font weight of those values |
| `--u-widget-title-scale` | `1` | Multiplies the size of a `header`'s heading (1.5 / 1.25 / 1.1rem by level) |
| `--u-widget-kicker-color` | `--u-widget-text-secondary` | Colour of a `header`'s kicker |

The value knobs are apart from the figure knobs on purpose: enlarging the headline figure of a `metric` does not enlarge
every value in a row.

### The title above a widget as a band or a tab

The title is plain text unless a host sets these; with a fill and an ink it is drawn as a filled strip, and with
`inline-block` and `max-content` as a tab.

| Property | Default | Effect |
|----------|---------|--------|
| `--u-widget-title-bg` | `transparent` | Fill of the title |
| `--u-widget-title-ink` | `--u-widget-text` | Text colour of the title |
| `--u-widget-title-pad` | `0` | Padding of the title |
| `--u-widget-title-radius` | `0` | Corner radius of the title |
| `--u-widget-title-display` | `block` | `inline-block` (with a width below) makes a tab |
| `--u-widget-title-width` | `auto` | `max-content` shrinks the title to its text |
