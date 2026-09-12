---
name: iyulab-u-widgets
description: Declarative, JSON-spec-driven widget system for visualization and input — one <u-widget> element that renders metrics, gauges, tables, forms, charts, and more from a single spec object. Use when working with @iyulab/u-widgets package.
license: MIT
metadata:
  author: iyulab
  version: "0.16.1"
---

# @iyulab/u-widgets

Data-driven widget system built on [Lit](https://lit.dev/). Unlike a typical component library
where each tag has its own properties, **every widget shares one API**: a single `spec` object
describing what to render. `<u-widget>` reads `spec.widget` and delegates to the matching
sub-component internally.

## Quick Start

```bash
npm install @iyulab/u-widgets
```

```ts
import '@iyulab/u-widgets';

const el = document.createElement('u-widget');
el.spec = { widget: 'metric', data: { value: 42, unit: 'users' } };
document.body.appendChild(el);
```

```html
<!-- Or declaratively — spec is JSON in the attribute -->
<u-widget spec='{"widget":"chart.bar","data":[{"name":"A","value":30}],"mapping":{"x":"name","y":"value"}}'></u-widget>
```

Only `spec.widget` is required. `mapping` (which data field feeds which visual channel) is
auto-inferred from the data shape when omitted — see
[`UWidgetMapping`](../../src/core/types.ts) for the full field reference per widget family.

## Entry Points

| Import | Enables | Peer dependency |
|--------|---------|------------------|
| `u-widgets` | Everything below except `chart.*` and `math` | — |
| `u-widgets/charts` | `chart.*` types (`uw-chart`) | `echarts` |
| `u-widgets/math` | `math` type (`uw-math`) | `katex` |
| `u-widgets/forms` | Swaps the built-in formdown parser for the full `@formdown/core` one | `@formdown/core` |
| `u-widgets/cdn` | Single `<script>` bundle (core + charts), for non-bundler usage | — |

Chart and math widgets are split out because their rendering libraries (`echarts`, `katex`) are
heavy — importing the core module alone doesn't pull them in.

---

## Widget Catalog

`spec.widget` selects one of these. Most map 1:1 to a `uw-*` custom element (also independently
usable directly, e.g. `<uw-metric .spec=${...}>`); a few (`actions`/`divider`/`header`) are rendered
inline by `<u-widget>` itself and have no separate tag.

| `widget` | Element | Description |
|----------|---------|--------------|
| `metric`, `stat-group` | `uw-metric` | Single value or a group of stat cards |
| `gauge`, `progress` | `uw-gauge` | Circular/radial progress indicator |
| `table`, `list` | `uw-table` | Data table or a list view of records |
| `form`, `confirm` | `uw-form` | Input fields (`fields` or `formdown` shorthand) with submit/cancel actions |
| `compose` | `uw-compose` | Lays out child widget specs (`stack`/`row`/`grid`) |
| `markdown`, `image`, `callout` | `uw-content` | Rendered markdown, an image, or a callout box |
| `kv` | `uw-kv` | Key/value pair list |
| `code` | `uw-code` | Syntax-highlighted code block |
| `citation` | `uw-citation` | Source citation card |
| `status` | `uw-status` | Status badge/indicator |
| `steps` | `uw-steps` | Step/stage progress tracker |
| `rating` | `uw-rating` | Star (or custom) rating display |
| `video` | `uw-video` | Embedded video player |
| `gallery` | `uw-gallery` | Image gallery |
| `math` | `uw-math` | Rendered math expression (`u-widgets/math`) |
| `chart.bar`, `.line`, `.area`, `.pie`, `.scatter`, `.radar`, `.heatmap`, `.box`, `.funnel`, `.waterfall`, `.treemap`, `.histogram` | `uw-chart` | ECharts-backed chart (`u-widgets/charts`) |
| `actions` | *(inline)* | Standalone group of action buttons |
| `divider` | *(inline)* | Horizontal rule, optionally labeled |
| `header` | *(inline)* | Inline heading (`data.level` 1–6) |

`suggestWidget(name)` (exported from the core module) suggests a close match when an unknown
`widget` value is used — `<u-widget>` shows this suggestion in its fallback card instead of
silently rendering nothing.

---

## Events

All widgets bubble a single `u-widget-event` custom event (`composed: true`) from `<u-widget>`,
carrying a [`UWidgetEvent`](../../src/core/types.ts) payload:

| `type` | Trigger | Payload |
|--------|---------|---------|
| `submit` | Form submit button | Form field values |
| `action` | Any action button (global action bar, standalone `actions` widget, or a widget's own) | Action `data` (e.g. `{ url }` for `navigate`) |
| `change` | Input value change | Changed field and value |
| `select` | Chart element click | Selected data point |

```ts
el.addEventListener('u-widget-event', (e: CustomEvent<UWidgetEvent>) => {
  if (e.detail.type === 'submit') console.log(e.detail.data);
});
```

## Sizing

Widgets grow to fit their content — in normal page flow they need no height. Give the host a height
only when the widget must fit a fixed box, and the constraint reaches the chart canvas, the table's
row area and the code body:

```html
<u-widget style="height: 400px"></u-widget>     <!-- chart fills the cell, not its 300px default -->
<u-widget style="max-height: 240px"></u-widget>  <!-- table rows scroll instead of overflowing -->
```

`--u-widget-chart-height` is the chart's height when nothing constrains the host, not a cap. Widgets
other than these three still grow past a host height — wrap them yourself if you must clip.
See [Widget Reference](../../docs/widgets.md#sizing) for the full contract.

## Theming

- [CSS Custom Properties](./references/css-custom-properties.md) — the full `--u-widget-*` token
  sheet (colors, spacing, typography, chart palette, shadow), shared by every element.
- `theme="dark"` / `theme="light"` attribute on `<u-widget>` forces a mode; omitted, it follows
  `prefers-color-scheme` (or an inherited `color-scheme`).
- `locale` attribute (e.g. `locale="ko"`) propagates to sub-components for validation messages
  and formatted values — see `registerLocale`/`resolveLocale` in the core module.
