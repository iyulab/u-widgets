# CSS Custom Properties

Every `u-widget`/`uw-*` element shares one token sheet (`styles/tokens.ts`, applied via `:host`).
Override any of them by styling the element directly:

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
| `--u-widget-warning` | `#d97706` | `#fbbf24` |
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
| `--u-widget-font-size` | `0.875rem` | Body tier |
| `--u-widget-font-size-label` | `0.8125rem` | Label tier |
| `--u-widget-font-size-caption` | `0.75rem` | Caption tier |
| `--u-widget-font-size-overline` | `0.6875rem` | Overline tier |

Kept local to this package rather than referencing `@iyulab/components`' `--u-text-*` tokens,
since `u-widgets` is designed to be usable standalone without that package installed.

## Chart Size

| Property | Value | Description |
|----------|-------|--------------|
| `--u-widget-chart-height` | `300px` | `uw-chart` height at normal container width |

## Shadow

| Property | Light | Dark |
|----------|-------|------|
| `--u-widget-shadow` | `0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)` | `0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)` |
| `--u-widget-shadow-hover` | `0 4px 12px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.06)` | `0 4px 12px rgba(0,0,0,.4), 0 2px 4px rgba(0,0,0,.2)` |

## Per-widget sizing (not in the shared sheet)

These two have no declared default in `tokens.ts` — they're consumed with an inline fallback in
the element that uses them, so they only take effect on that specific tag:

| Property | Default | Used by |
|----------|---------|---------|
| `--u-widget-chart-height-narrow` | `200px` | `uw-chart` (inside a `max-width: 20rem` container query) |
| `--u-widget-gauge-size` | `160px` | `uw-gauge` (`max-width`) |
