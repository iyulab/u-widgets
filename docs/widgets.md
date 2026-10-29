# Widget Reference

## Spec Envelope

Every u-widget follows a single structure:

```jsonc
{
  "widget": "<widget-type>",   // only required field
  "data": { ... },             // inline data (object or array)
  "mapping": { ... },          // data field → visual channel (auto-inferred if omitted)
  "fields": [ ... ],           // form/confirm field definitions (input only)
  "options": { ... },          // rendering hints
  "actions": [ ... ],          // user interactions
  "id": "",                    // unique identifier
  "title": "",                 // optional title
  "description": ""            // optional description
}
```

Only `widget` is required. Everything else is optional or auto-inferred.

## Widget Types

### Display

| Widget | Purpose | Required Mapping |
|---|---|---|
| `chart.bar` | Bar chart | `x`, `y` |
| `chart.line` | Line chart | `x`, `y` |
| `chart.area` | Area chart | `x`, `y` |
| `chart.pie` | Pie / donut chart | `label`, `value` |
| `chart.scatter` | Scatter plot | `x`, `y` |
| `chart.radar` | Radar chart | `axis`, `y` (one polygon per field) |
| `chart.heatmap` | 히트맵 | `x`, `y`, `value` |
| `chart.box` | 박스플롯 | `x`, `y` (five fields: min, q1, median, q3, max) |
| `chart.funnel` | 깔때기 차트 | `label`, `value` |
| `chart.waterfall` | 폭포 차트 | `x`, `y`, `total?` |
| `chart.treemap` | 트리맵 | — (uses `name`, `value`, `children` in the data) |
| `chart.histogram` | Histogram (auto-binning) | `value` (or a flat `number[]`) |
| `chart.gantt` | Gantt / interval chart | `y`, `start`, `end`, `label?`, `color?` (bars of a group share a colour) |
| `metric` | Single KPI value | — (uses data shape) |
| `stat-group` | Multiple KPIs in a row — cells never shrink below their value; overflow wraps to new rows | — (uses data shape) |
| `gauge` | A reading against its scale — an arc, a column, a tank or a thermometer ([Gauge](#gauge)) | — (uses `data.value`, and `data.min` / `data.max` for the scale when given; the shown value is `options.format`, default `number`, in the widget's locale) |
| `progress` | Progress bar | — (uses `data.value`) |
| `bar-list` | Items compared as bars or glyph counts | — (uses `data[].label`, `data[].value` — [Bar list](#bar-list)) |
| `table` | Data table (sortable) | `columns` (auto-inferred) |
| `list` | Structured list — a log, a queue, a timetable | `primary`, `secondary`, `avatar`, `trailing`, `time`, `tone`, `columns` — [List rows](#list-rows) |
| `code` | Syntax-highlighted code | — (uses `data.content`) |
| `citation` | Source/reference cards | — (uses data array) |
| `status` | Inline status badge | — (uses `data.value`, `data.label?`, `data.tone` — [Tones](#tones)) |
| `status-grid` | Many small cells, each with a state | — (uses `data[].tone`, `data[].label` — [Status grid](#status-grid)) |
| `status-card` | One asset or place: name, state, readings | — (uses `data.title`, `data.tone`, `data.readings` — [Status card](#status-card)) |
| `steps` | Multi-step progress | — (uses data array) |
| `rating` | Star/heart/thumb rating | — (uses `data.value`) |
| `video` | HTML5 video player | — (uses `data.src`; subtitle / caption tracks in `data.tracks`: `[{ src, srclang?, label?, kind?, default? }]`, WebVTT) |
| `gallery` | Image gallery grid | — (uses data array) |
| `kv` | Label · value pairs — a stat list | — (an object, or `[{ label, value, unit?, format?, tone?, note? }]`) |
| `math` | LaTeX math expression | — (uses `data.expression`) |

### Input

| Widget | Purpose |
|---|---|
| `form` | Data entry with typed fields |
| `confirm` | Yes/no confirmation dialog |

### Composition

| Widget | Purpose |
|---|---|
| `compose` | Combine multiple widgets into a single card |

## Auto-Inference

When `mapping` is omitted, the renderer infers it from data structure:

- First string field → `x`, first number field → `y`
- All object keys → table columns
- All object keys → text input fields

## Mapping

```jsonc
// Chart
"mapping": { "x": "fieldName", "y": ["field1", "field2"], "color": "fieldName" }

// Table (optional `tone` bolds a column's cells in that tone's colour — see Tones; more in Table Options)
"mapping": { "columns": [{ "field": "id", "label": "ID", "format": "number", "align": "right" }, { "field": "yield", "label": "Yield", "tone": "ok" }] }

// List
"mapping": { "primary": "name", "secondary": "description", "avatar": "imageUrl", "trailing": "score" }
```

### Data as an API returns it

A widget that takes an array of records (charts, `table`, `list`, …) also reads the two other shapes an API
commonly answers in, so `data` can be passed as it came:

- **Columns** — one array per field, all of one length, as time series usually arrive. Read as one row per index:
  `{ "time": ["00:00", "01:00"], "temp": [15.5, 17.5] }` is `[{ "time": "00:00", "temp": 15.5 }, …]`.
  Columns hold values: an object wrapping an array of records (`{ "items": [{…}] }`) is not columns and is still an error.
- **Nested records** — a chart's or table's rows with fields grouped in objects, as GeoJSON features carry them, are
  read by dotted path: `"mapping": { "x": "properties.place", "y": "properties.mag" }`, and a table without
  `columns` shows `properties.place` and `properties.mag` as columns. Arrays stay values. A key that already
  contains a dot, as written, is kept over a flattened one.

`validate`, `infer` and `suggestMapping` read `data` the same way.

## Format Hints

| Format | Output |
|---|---|
| `number` | `1,234` — a nonzero value too small for three decimals keeps four significant digits: `7.729E-8` |
| `number:2` | `1,234.50` — fixed decimals (0–20) |
| `currency` | `$1,234.00` (기본: USD) |
| `currency:KRW` | `₩1,234` |
| `currency:EUR` | `€1,234.00` |
| `currency:JPY` | `¥1,234` |
| `percent` | `73%` |
| `percent:1` | `73.5%` |
| `date` | `2025-01-15` |
| `datetime` | `2025-01-15 14:30` |
| `time` | `14:30` |
| `bytes` | `1.2 GB` |

A negative value that rounds to zero is written as zero in every number format — `0.00`, never `-0.00`.

`date`, `datetime` and `time` read a value written in ISO 8601 (`2025-01-15T14:30:00Z`), with a space or dots between
its parts (`2025-01-15 14:30`, `2025.01.15`), or as compact digits (`20250115`, `202501151430`,
`20250115 1430`) — the forms public APIs often use. A time without an offset is shown as the wall-clock time
it writes; a value that is not a valid date is shown as it is.

## Sizing

Every widget grows to fit its content, so a widget in normal page flow needs no height at all.
Give the host a height (`height` or `max-height`) only when the widget must fit a fixed box — a
dashboard cell, a split pane, a card of a set size — and the widget stays inside it:

```html
<!-- the chart fills the cell instead of staying at its 300px default -->
<u-widget style="height: 400px"></u-widget>

<!-- a long table scrolls inside 240px instead of overflowing the card -->
<u-widget style="max-height: 240px"></u-widget>
```

| Widget | What a host height reaches | Height without a constraint |
|---|---|---|
| `chart.*` | the chart canvas, which resizes with it — a chart with axes keeps its axis labels inside the canvas at any size, with room above the plot only for a legend or a reference line's label; below about 320×260px — the canvas size decides, whether a host height or a narrow container (the 200px default inside 20rem) made it small — the chart switches to a compact layout (tight margins that keep the axis labels inside, fewer value ticks, a smaller legend — or none when the canvas is too short — and pie labels moved off the outside of the pie) | `--u-widget-chart-height` (300px; 200px inside a 20rem container) |
| `table` | the row area — the search box and pager stay put, rows scroll | grows to fit every row |
| `code` | the code body — the language header stays put, lines scroll | grows to fit every line (`options.maxHeight` caps it independently) |
| `list` · `citation` · `steps` · `status` | the item area — items scroll | grows to fit every item |
| `markdown` · `callout` | the prose box — text scrolls | grows to fit the text |
| `gallery` | the image grid — rows of thumbnails scroll | grows to fit every row |
| `stat-group` | the cell area — wrapped rows scroll vertically, and the horizontal clip that hides the leading divider stays in place | grows as cells wrap |
| `form` | the field area — fields scroll | grows to fit every field |
| `compose` | the layout area — the title stays put, children scroll | grows to fit its children |
| `image` · `video` · `gauge` | the media, which scales down whole — keeping its aspect ratio, and for `gauge` its value and label with it — rather than scroll | the media’s own size (`gauge` is `--u-widget-gauge-size` wide, 160px) |

Every widget honours a host `height` or `max-height`. Nothing is squashed out of shape: content that
runs on scrolls, so none of it becomes unreachable, and media scales down with its aspect ratio kept.

`toEChartsOption(spec, size)` (from `@iyulab/u-widgets/charts`) takes the canvas size as its second
argument and returns the compact layout for a small one; `<uw-chart>` passes its own size and
rebuilds the option when the layout changes. Anything set in `options.echarts` still wins.

## Tones

A widget that colours a value by its state takes a **tone** — one of eleven, the same in every widget (`status` items,
`metric` and `stat-group` values, `table` columns, `callout`):

| Tone | Means | Mark |
|---|---|---|
| `ok` | normal | ✓ |
| `info` | something to know, not a fault — its own blue, apart from the accent | ● |
| `watch` | an early sign, before a warning | ◆ |
| `warn` | a warning | ▲ |
| `alarm` | a fault — act now | ✕ |
| `off` | switched off, not running | – |
| `idle` | on, waiting for work | ○ |
| `accent` | picked out, with no judgement (the primary colour) | ★ |
| `past` · `now` · `next` | where an item is in a sequence — a timeline, a queue, a schedule | ✓ · ▶ · › |

An app maps its own state names (`cooking`, `boarding`, `free`) to a tone; the tone is what is drawn. A word that is not
a tone draws as no tone and warns once in the console, naming the tones. A `status` item with a tone and no `value`
shows the tone's name in the widget's locale («Alarm», «경보»).

```json
{ "widget": "status", "data": [{ "label": "Pump A", "value": "Running", "tone": "ok" }, { "label": "Pump B", "tone": "alarm" }] }
```

The colours are the tokens `--u-widget-tone-ok` … `--u-widget-tone-next` (light and dark — see Theming); `ok`,
`alarm` and `accent` follow `--u-widget-positive`, `--u-widget-negative` and `--u-widget-primary`. `warn` has a
colour of its own (`#b45309`, dark `#fbbf24`) so it reads as text on the page; the components bridge takes it from
`--u-warning-color-strong`. `TONES`, `isTone` and `toneLabel(tone, strings)` are exported for an app that draws its own
legend.

A `callout` is announced to assistive technology as it appears — a `warn` or `alarm` one at once (`role="alert"`), the other
tones at the next pause. That fits a message that says something has just happened. For content already written — a saved
report, an earlier conversation — set `options.live` to `"off"`: the callout is then a plain `note` that is not announced,
and keeps the look of its tone. The default is `"auto"`.

## List rows

A `list` row can say more than its text. `mapping.tone` names the field holding each row's tone ([Tones](#tones)): the
row shows the tone's mark and its text the tone's colour — and in a sequence, `past` dims the row, `now` picks it out
and `next` is plain. `mapping.time` shows a time first in each row (a date-time as its time of day, in the widget's
locale). `mapping.columns` (`[{ field, label?, format?, align?, tone? }]`, as in a table) adds values after the text,
each formatted, under a caption row when any column has a `label`.

`options.maxItems` shows at most that many rows and then a line saying how many more («+3 more», «외 3건»);
`options.layout: "tiles"` draws each row as a small card, as many to a line as fit.

```json
{ "widget": "list", "data": [
    { "at": "2026-10-23T08:30:00", "what": "Pushback", "gate": "A4", "state": "now" },
    { "at": "2026-10-23T09:10:00", "what": "Arrival", "gate": "B2", "state": "next" }],
  "mapping": { "primary": "what", "time": "at", "tone": "state", "columns": [{ "field": "gate", "label": "Gate" }] },
  "options": { "maxItems": 6 } }
```

## Stat list (`kv`)

`kv` lists label · value pairs. Its data is an object (each key a label) or an array of
`{ label, value, unit?, format?, tone?, note? }` — each value formatted as `format` says with its unit after it,
coloured and marked by its tone, with a note under it in small type. `options.layout` is `vertical` (labels beside the
values), `horizontal` (pairs in a row) or `grid` (`options.columns` to a row).

```json
{ "widget": "kv", "data": [{ "label": "Flow", "value": 412.5, "format": "number:1", "unit": "m³/h" },
                           { "label": "Pressure", "value": 7.9, "unit": "bar", "tone": "warn", "note": "limit 8" }],
  "options": { "layout": "grid", "columns": 2 } }
```

## Header

`header` is a heading — `text` at `level` 1–3 — with what usually stands around a board's or a section's title:
a `kicker` above it (a series, a site), a `subtitle` under it, and on the far side the `date` and `time` it is for
(a date-time shows its time of day) or a running `clock: true` (hours and minutes, refreshed while on the page), a few
`aside` pairs (`[{ label, value, unit?, format?, tone? }]`) and the state of the whole as a `tone` badge with its
`status` words. Narrow, the far side wraps under the heading.

```json
{ "widget": "header", "data": { "kicker": "Port of Incheon", "text": "Harbour cranes", "level": 1, "clock": true,
  "aside": [{ "label": "Working", "value": 9 }, { "label": "Down", "value": 1, "tone": "alarm" }], "tone": "watch" } }
```

## Gauge

`gauge` is a reading against its scale (`options.min` 0 to `options.max` 100, `options.unit`, the value written as
`options.format` says). A scale the source gives — a capacity, a floor — rides in the data (`data.min`, `data.max`) and
wins over the options, in every form; the options are the scale where the data gives none. `options.form` draws it as an `arc` (the default) or as a level rising from the bottom — a
`vertical` column, a `tank` or a `thermometer` — with the reading written above it. Its colour is `data.tone` when the
state is decided elsewhere, else the `options.thresholds` step it is under: `[{ to, color | tone, label? }]`, the label
written under the reading. `options.band: { lo, hi }` is the acceptable range, drawn beside the scale in the `ok` tone
(`lo` or `hi` alone runs to the scale's end); `options.marks: [{ at, label? }]` are labelled lines on the scale — a set
level, an alarm limit.

```json
{ "widget": "gauge", "title": "Cold room", "data": { "value": 3.4, "tone": "ok" },
  "options": { "form": "thermometer", "min": -5, "max": 15, "unit": "°C", "format": "number:1",
               "band": { "lo": 2, "hi": 8 }, "marks": [{ "at": 8, "label": "8°" }, { "at": 2, "label": "2°" }] } }
```

## Bar list

`bar-list` compares items as bars — rides an hour, stock on a shelf, calls in a queue — without a chart's axes. Its data
is `[{ label, value, max?, unit?, format?, tone?, note? }]`: each row its label, its value written as `format` and
`unit` say, and a bar under them in its tone (or the primary colour), with an optional `note` below. The bars share one
scale — `options.max`, else the largest value — unless an item has its own `max` (a stock against its own shelf).
`options.form: "pictogram"` draws each value as a row of glyphs instead: `options.glyph` (default `●`), one for each
`options.glyphValue` (default 1), the rest of the item's scale as faint glyphs; a row that would need more than sixty
glyphs is drawn as a bar. `options.maxItems` shows that many rows and a line saying how many more. Each row is spoken as
its label and value.

```json
{ "widget": "bar-list", "title": "Vaccine stock",
  "data": [{ "label": "Flu", "value": 34, "max": 40, "unit": "doses" },
           { "label": "Tetanus", "value": 9, "max": 30, "unit": "doses", "tone": "warn", "note": "Order placed" }] }
{ "widget": "bar-list", "data": [{ "label": "Calls waiting", "value": 25 }],
  "options": { "form": "pictogram", "glyph": "☎", "glyphValue": 5, "max": 40 } }
```

## Status grid

`status-grid` is many small cells, each with a state — the seats of a hall, the beds of a ward, the bays of a rack,
the lamps of an annunciator. Its data is `[{ label?, tone, value?, unit?, format? }]`: each cell in its tone, with its
label (and value) inside and the whole spoken as its name. `options.columns` fixes how many go to a row (otherwise as
many as fit); `options.cell` is `square` (default), `chip` (a wider pill) or `dot` (the tone alone — the label stays its
name); `options.counts: true` adds a key with how many cells are in each tone.

```json
{ "widget": "status-grid", "title": "Ward 4B",
  "data": [{ "label": "01", "tone": "ok" }, { "label": "02", "tone": "alarm" }, { "label": "03", "tone": "idle" }],
  "options": { "columns": 6, "counts": true } }
```

## Status card

`status-card` is one asset or place — a pump, a rack, a stall, a ticket — with its state and a few readings. It reads
`title` and, optionally, `subtitle`, `tone` (the stripe and the badge's colour and mark), `status` (the badge's words —
the tone's name in the widget's locale when left out), `emphasis` (`stamp` puts the words on the card as a stamp),
`readings` (`[{ label, value, unit?, format?, tone? }]` — each value formatted as `format` says, a reading's own tone
colouring its value), `meter` (a value against its range — [Meters](#meters)), `image` (a URL or an inline `data:image/…` — the card's picture) or `icon` (a short text or emoji instead), and
`note` (a line at the foot).

```json
{ "widget": "status-card", "data": {
  "title": "Pump P-3", "subtitle": "Intake, east bank", "tone": "warn", "status": "Vibration high",
  "readings": [{ "label": "Flow", "value": 412.5, "format": "number:1", "unit": "m³/h" },
               { "label": "Vibration", "value": 7.2, "unit": "mm/s", "tone": "warn" }],
  "meter": { "value": 68, "unit": "%" }, "note": "Bearing check booked for 14:00" } }
```

It fits small boxes, from about 130px wide: under 180px the badge moves below the name, the picture shrinks and the
readings stack one per line. What still does not fit is clipped — or, with `options.overflow`, faded out (`fade`) or
scrolled (`scroll`).

## Metric Data

`metric` (and each item of `stat-group`) reads `value` and, optionally, `label`, `unit`, `prefix`, `suffix`, `change`
(a percentage, with `trend`: `up` · `down` · `flat`), `icon`, `tone` (the value's colour — [Tones](#tones)), `emphasis`,
`meter` (the value against its range — [Meters](#meters)), `note` (a line under the value) and `sparkline` — the recent
values, oldest first, drawn as a small line under the value. The line is scaled to its own range (it shows the shape,
not the size), takes the tone's colour or the primary one, and needs two numbers or more.

```json
{ "widget": "metric", "data": { "value": 18.4, "unit": "Tbps", "label": "Traffic", "sparkline": [14.2, 15.8, 17.1, 16.4, 18.4] } }
{ "widget": "metric", "data": { "label": "Bored", "value": 1240, "unit": "m", "tone": "now",
  "meter": { "value": 1240, "max": 2000, "unit": "m", "format": "number" }, "note": "Ring 412 of 668" } }
```

### Meters

A `meter` is a value against its range: `{ value, min?, max?, unit?, format?, tone?, form? }` — `min` 0 and `max` 100
unless given, the value written beside it as `format` and `unit` say. `form` is `bar` (the default) or `ring`. It takes
its own `tone`'s colour, else its widget's or item's, else the primary one, and is announced as a meter of that range
with the written value. On a `metric`, a meter of the figure itself writes nothing beside it — the figure is above. A
value outside the range fills the meter to its end; a meter with no number, or a `max` not
above `min`, is not drawn.

## Table Options

| Option | Type | Description |
|---|---|---|
| `pageSize` | `number` | 페이지당 행 수. 설정 시 하단 페이지 컨트롤 표시 |
| `searchable` | `boolean` | 검색 입력 필드 표시 (기본: false) |
| `sortable` | `boolean` | 컬럼 헤더 클릭으로 정렬 (기본: true) |
| `interactive` | `boolean` | `false` — a table only to be looked at (a wall, a board): no search, sorting, pages, row focus or picking a row (default: true) |
| `maxItems` | `number` | Show at most this many rows when the table is not paged, then a line saying how many more |

A column (`mapping.columns`) is `{ field, label?, format?, align?, unit?, tone?, toneField?, cell?, max? }`: `unit` is
written after each value; `tone` draws every cell of the column in a tone, `toneField` names a field of the row with
that cell's own tone; `cell: "bar"` draws the value as a bar against the column's scale (`max`, else its largest value),
written beside it, and `cell: "tone"` reads the value as a tone and draws its mark and name. `mapping.tone` names a field
with each row's tone — a stripe, a tint and the tone's mark in the first cell (`past` dims a row, `now` picks it out).

```json
{ "widget": "table", "title": "Links",
  "data": [{ "site": "Busan", "state": "alarm", "util": 97, "utilTone": "alarm" }],
  "mapping": { "tone": "state", "columns": [{ "field": "site", "label": "Site" },
    { "field": "state", "label": "State", "cell": "tone" },
    { "field": "util", "label": "Use", "cell": "bar", "max": 100, "unit": "%", "toneField": "utilTone" }] },
  "options": { "interactive": false } }
```

**Example:**
```json
{
  "widget": "table",
  "data": [...],
  "options": { "pageSize": 20 }
}
```

## Code Options

| Option | Type | Description |
|---|---|---|
| `lineNumbers` | `boolean` | Show line numbers (default: true) |
| `wrap` | `boolean` | Wrap long lines instead of scrolling horizontally (default: false) |
| `maxHeight` | `string` | CSS length capping the code body, e.g. `"320px"`. Independent of any host height |
| `highlight` | `number[]` | 1-based line numbers to emphasise |

## Chart Options

| Option | Type | Applies To | Description |
|---|---|---|---|
| `stacked` | `boolean` | bar, line, area | Stack series |
| `horizontal` | `boolean` | bar, line, scatter | Swap axes — the categories then run top to bottom in the data's order |
| `valueAxisZero` | `boolean` | bar, line, area | `false` spans the value axis over the data instead of always reaching zero — for values that move far from zero, such as a control chart around its centre line or a process temperature. Default `true`. Follows the value axis when `horizontal`; reaches every value axis of a chart with two |
| `smooth` | `boolean` | line, area | Smooth curves |
| `xAxisType` | `'category' \| 'value'` | line, area | `'value'` puts each point at its numeric `x` — a profile over uneven times or distances — instead of evenly spaced categories. The x axis then starts at the data, not at zero. Default `'category'` |
| `referenceLines` | `object[]` | bar, line, area, scatter, histogram, gantt | Lines at a value — a limit, a target: `axis` (`'y'` the value axis of an upright chart, `'x'` the category or time axis; on a `horizontal` bar chart the values run along `'x'`), `value`, `label`, `color`, `style` (`'solid'`, `'dashed'`, `'dotted'`). A value-axis line past the data widens the axis to reach it |
| `series` | `object[]` | bar, line, area | Per-series settings, in `mapping.y` order: `label` (the name in the legend and tooltip — the field name otherwise, which is often a source's code such as `PM`), `color`, `lineStyle` (`'solid'`, `'dashed'` or `'dotted'` as in `referenceLines`, or an ECharts `lineStyle` object such as `{ "type": "dashed", "width": 2 }`), `symbol`, `type`, `yAxisIndex` |
| `donut` | `boolean` | pie | Donut chart |
| `showLabel` | `boolean` | pie, gantt | Show data labels (gantt: in-bar segment labels, default on) |
| `categories` | `string[]` | gantt | Row order top to bottom; listed rows stay on the axis without intervals |
| `echarts` | `object` | all charts | Raw ECharts option passthrough (recursively deep-merged; `series`, `xAxis` and `yAxis` arrays merge element by element; see below) |
| `colorRange` | `[string, string]` | heatmap | 색상 범위 `["#e0f2fe","#0c4a6e"]` |

### Waterfall totals

By default every waterfall row is a **delta** added to the running total. To draw an
**absolute total bar from zero** (opening or closing balance), name a per-row flag field
with `mapping.total` — truthy rows are drawn from 0 and reset the running total to their
own value (so a leading total is an opening balance, a trailing total a closing balance).
Total bars get a distinct neutral color. Omit `mapping.total` for a pure cumulative-delta
waterfall (unchanged default).

```ts
{
  widget: 'chart.waterfall',
  data: [
    { step: 'Revenue', amount: 500, isTotal: true },  // opening total, from 0
    { step: 'Cost',    amount: -200 },                 // delta
    { step: 'Tax',     amount: -80 },                  // delta
    { step: 'Profit',  amount: 220, isTotal: true },   // closing total, from 0 (not 2×)
  ],
  mapping: { x: 'step', y: 'amount', total: 'isTotal' },
}
```

### Gantt / interval charts

`chart.gantt` draws rows × `[start, end]` segments — schedules, shift plans, project timelines.
Each data row is one interval; a row name (`mapping.y`) can repeat to put several intervals on
the same row.

- **Rows run top to bottom in the order they first appear.** `options.categories` fixes that
  order and keeps a listed row on the axis even when it has no intervals (an idle machine).
  Rows not listed there follow in data order.
- **`start` / `end` are numbers** (a value axis) **or date-like strings / timestamps** (a time
  axis). An end before its start is drawn in order; a row without a finite start or end is
  skipped (its row name still appears).
- **Segments on one row are separated by a 1px gap**, and a zero-length interval is drawn as a
  2px sliver. Overlapping intervals are both drawn; the later one is on top.
- **`mapping.label`** is written inside a segment when the segment is wide enough (truncated
  to fit). `options.showLabel: false` turns in-bar labels off. The tooltip shows
  `row / label: start → end`.
- **`mapping.color`** splits intervals into one series per value — each gets a palette color
  and a legend entry.
- **`options.referenceLines`** on the value axis widen it to reach a line the data does not — a limit or target
  past the data is drawn, at a round axis bound just beyond it.
- **`options.referenceLines`** with `axis: 'x'` draws a vertical line at a value or date
  (makespan, due date). `options.xFormat` formats the value/time axis — e.g.
  `"date"` on a time axis.

When `mapping` is omitted: first string → `y`, first two number or date-like fields →
`start`/`end`, next string → `label`.

```ts
{
  widget: 'chart.gantt',
  data: [
    { machine: 'M1', job: 'J1', start: 0, end: 3 },
    { machine: 'M2', job: 'J1', start: 3, end: 5 },
    { machine: 'M2', job: 'J2', start: 0, end: 3 },
    { machine: 'M1', job: 'J3', start: 3, end: 6 },
  ],
  mapping: { y: 'machine', start: 'start', end: 'end', label: 'job', color: 'job' },
  options: {
    categories: ['M1', 'M2', 'M3'],   // M3 has no work but stays on the axis
    referenceLines: [{ axis: 'x', value: 6, label: 'Makespan', style: 'dashed' }],
  },
}
```

### Times on the category axis

A bar, line or area chart whose x values are all dates or times as a source sends them (`2026-10-23`,
`2026-10-23T09:00:00+09:00`) labels them in the widget's locale, as short as the span allows: the time of day when every
value is on one day, the date when every value is a midnight, both otherwise — the tooltip shows the same label.
`xFormat`, `categoryAxisFormat` or `xAxisType` set by the spec take over. The value axis format (`yFormat`, or
`valueAxisFormat`) is also how the tooltip writes the values, unless the spec gives the tooltip a formatter of its own.

### Axis label control (interval / rotate / name)

Axis config must go under **`options.echarts`** — it is deep-merged onto the generated
axis, so the builder's category data is preserved. `series`, `xAxis` and `yAxis` given as arrays merge by index onto
the generated ones (`series: [{ type: 'line' }]` changes the first series and keeps its data and reference lines;
entries past the generated ones are added); every other array replaces. Placing `xAxis`/`yAxis` at the
`options` top level is ignored (a dev warning points to the fix). Use this when long or
numerous category labels are auto-hidden by ECharts:

```ts
options: {
  echarts: {
    xAxis: { axisLabel: { interval: 0, rotate: 30 } }, // force every label to show
    yAxis: { name: 'Units' },
  },
}
```

## Math

Requires the separate entry point and `katex` peer dependency:

```ts
import '@iyulab/u-widgets/math';
```

```json
{ "widget": "math", "data": { "expression": "E = mc^2" } }
```

| Option | Type | Default | Description |
|---|---|---|---|
| `displayMode` | `boolean` | `false` | Block mode with centered large formula |

**Display mode (block):**
```json
{
  "widget": "math",
  "data": { "expression": "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  "options": { "displayMode": true }
}
```

Uses MathML output for zero-CSS Shadow DOM rendering. Invalid LaTeX shows an error message with the original expression.

## Actions

```jsonc
"actions": [
  { "label": "Submit", "action": "submit", "style": "primary" },
  { "label": "Cancel", "action": "cancel" }
]
```

Reserved actions: `submit`, `cancel`, `navigate`. Custom strings are forwarded to the host.

## Events

```typescript
interface UWidgetEvent {
  type: "submit" | "action" | "change" | "select";
  widget: string;
  id?: string;
  action?: string;
  data?: Record<string, any>;
}
```

Listen via `u-widget-event` custom event on the `<u-widget>` element.

| `type` | Emitted by | `action` | `data` |
|---|---|---|---|
| `submit` | `form` / `confirm` submit (after validation) | — | all field values |
| `submit` | `rating` with `options.interactive` — a value picked | — | `{ value }` |
| `change` | `form` field edited | — | `{ field, value }` |
| `action` | `cancel` on a `form` / `confirm` (button or Escape) | `'cancel'` | — |
| `action` | any other form action button | its `action` | all field values |
| `action` | an action in the global action bar or an `actions` widget | its `action` | `{ url }` when the action has one |
| `action` | a linked `citation` opened | `'navigate'` | `{ url, title }` |
| `select` | `table` row / `list` item clicked (or Enter / Space) | — | the row's fields plus `_index` |
| `select` | a chart mark clicked | — | `{ name, seriesName, value, dataIndex }`, plus `_index` on some charts (below) |

An action button whose `action` is `navigate` and has a `url` opens it in a new tab and emits no
event.

**`_index` is always the row's index in `spec.data`** — for a table it does not change with search,
sort or paging. A chart's `dataIndex` is the mark's index **within its series**; where that does not
identify a row, the payload adds `_index` too:

| Chart | Why `dataIndex` is not the row |
|---|---|
| `chart.gantt` | segments are grouped by `color`, and rows without a finite start/end are skipped |
| `chart.scatter` with `mapping.color` | one series per group |

```ts
widget.addEventListener('u-widget-event', (e) => {
  const { type, data } = e.detail;
  if (type === 'select' && typeof data?._index === 'number') open(spec.data[data._index]);
});
```

## Composition

```json
{
  "widget": "compose",
  "layout": "grid",
  "children": [
    { "widget": "metric", "span": 1, "data": { "value": 42 } },
    { "widget": "gauge",  "span": 1, "data": { "value": 73 } }
  ]
}
```

Layout modes: `stack` (vertical, default), `row` (horizontal), `grid` (with `span` and optional `columns`).

> **최대 중첩 깊이:** `compose` 안에 `compose`를 중첩할 수 있으며, 최대 10단계까지 허용됩니다. 초과 시 검증 에러가 반환됩니다.

## Form (formdown)

Forms can be written in [formdown](https://github.com/iyulab/formdown) instead of a `fields` array — the text is read
by `@formdown/core` (a dependency of this package), so any form formdown reads is read the same way here:

```json
{
  "widget": "form",
  "formdown": "@name*(Name): []\n@email(Email): @[]\n@role{admin,user}(Role): s[]"
}
```

| Marker | Type |
|---|---|
| `[]` | text |
| `@[]` | email |
| `#[]` | number |
| `?[]` | password |
| `%[]` | tel |
| `&[]` | url |
| `T4[]` | textarea (4 rows) |
| `d[]` · `dt[]` · `t[]` | date · datetime · time |
| `R[]` | range |
| `s[]` | select |
| `s[multiple]` | multiselect |
| `r[]` | radio |
| `c[]` | checkbox |
| `c[switch]` | toggle (a single checkbox shown as a switch) |

Attributes go inside the brackets, separated by spaces: `R[min=0 max=100 step=5]`,
`[minlength=2 maxlength=10 pattern="^\w+$" placeholder="Code"]`. Buttons: `@[submit "Save"]` and `@[reset "Clear"]`
become the `submit` and `cancel` actions; any other action is a named button — `@remove: [button label="Delete" style="danger"]`
is the action `remove`. `validate()` reports a line formdown cannot read (it is left out of the form) as a warning with
its line number — and front matter (`---` … `---`), which the form takes no values from.

Modifiers: `*` = required, `(Label)` = display label, `{a,b}` = options. An option written
`value=Label` submits `value` and shows `Label` — `@kind{hw=Hardware,sw=Software}(Kind): s[]`
(`\,` and `\=` keep a comma or `=` inside an option). In a `fields` array the same option is
`{ "value": "hw", "label": "Hardware" }`; a plain string is a value shown as itself.

### How the fields behave

The fields are drawn, checked and offered suggestions by `<formdown-ui>` (`@formdown/ui`). A `fields` array is written
as formdown for it, so a form reads the same whichever way it is given.

- On submit every rule a field declares is checked — required, length, range, number, email, URL, phone, date and
  `pattern` (which matches the whole value). Each failing field shows why under it and is marked `aria-invalid`; the
  first one takes focus. The sentences are the widget locale's.
- A field's `message` replaces that sentence for whichever rule its value breaks first — one sentence a field, as
  `setCustomValidity` gives a control. In formdown text: `@name*(Name): [minlength=2 error-message="Tell us your name"]`.
- Enter in a field moves to the next one; the form is submitted through its `submit` action, never by Enter.
- A `multiselect` is a `<select multiple>`; a `toggle` is a checkbox drawn as a switch.
- Values are sent typed: a number or range field's as a number, a datetime's as `YYYY-MM-DDTHH:mm` in local time.
- Parts, for `uw-form::part(…)`: `field`, `label`, `input`, `field-error`, `description`, `radio-group`,
  `checkbox-group`, `option-label`, `suggestion`, `decline`, `field-note`.

### Suggested values (`fieldStates`)

A host that can guess what goes in a field — from earlier records, another system, a model — says so per field name
in `fieldStates`. It is the same shape `@formdown/ui`'s `<formdown-ui>` takes, so one suggestion source serves both:

```json
{
  "widget": "form",
  "formdown": "@vendor*(Vendor): []\n@qty(Quantity): #[]",
  "fieldStates": {
    "vendor": { "suggestions": ["Acme Supply", "Globex"], "note": "Used on the last 3 orders", "decline": "Neither" },
    "qty": { "suggestions": ["12"] }
  }
}
```

- The first suggestion shows in the empty field in place of its placeholder; every suggestion is a button under the
  field, beside the `note`.
- A button shows the suggestion as the field shows it — an option's label, not its value — and says with
  `aria-pressed` whether it is the field's value now; a field's buttons are a group named for the field.
- Picking one puts it in the field — a number field reads it as a number, a multiselect adds it — and the widget sends
  `suggestion-pick` (`data: { field, value }`, the value — not the label), then the usual `change`.
- `decline` adds a button with that label; it sends `suggestion-decline` (`data: { field }`) and changes nothing.
- A new `fieldStates` keeps what the user has typed — only new `data` or `fields` start the form over.
- Parts: `suggestions`, `suggestion`, `note`, `decline`.

### Date fields and locale in an `@iyulab/components` app

`date` and `datetime` fields use the browser's native inputs, whose display follows the browser's
language. An app that already uses `@iyulab/components` can opt in to its date picker:

```ts
import '@iyulab/u-widgets';
import '@iyulab/u-widgets/components';   // needs @iyulab/components ≥ 2.8
```

The fields then render `<u-date-picker>` (typed entry, calendar, the app's locale). What the form
submits does not change: `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm` (local time) for `datetime`. The picker is
registered as formdown's `date` and `datetime-local` field types, so any `<formdown-ui>` on the page draws it too.

The same import makes u-widgets follow the components locale: its default locale is `Locale.get()`
and moves with every `Locale.set()`, so one call switches the whole app. A widget's own `locale`
still wins.

## Locale

The text a widget writes itself — table pagination, search, form validation messages, the accessible
names of its regions, the code block's copy button, the fallback card — is English by default.
Korean ships with the package:

```ts
import '@iyulab/u-widgets';
import '@iyulab/u-widgets/locales/ko';
```

The import registers `ko`. A widget speaks it when its locale is `ko` or `ko-KR` — its own `locale`
attribute, else `setDefaultLocale()`, else `<html lang>`. The module also exports the table as `ko`.

For another language, register its strings; anything left out stays English:

```ts
import { registerLocale } from '@iyulab/u-widgets';
registerLocale('ja', { prev: '前へ', next: '次へ' /* … */ });
```

Numbers and dates in a widget follow the same locale (`options.locale`, which `<u-widget>` fills in).

### Switching the locale at runtime

`setDefaultLocale()` and `registerLocale()` reach widgets already on screen — every connected
`<u-widget>` re-renders (a widget detached during the switch catches up when attached again). Form
input survives the re-render; an error message on screen is rewritten in the new language. Your own
code can listen with `onLocaleChange(listener)`, which returns the unsubscribe function.

## Theming

CSS custom properties **on the widget element itself** — a rule that selects it (`u-widget { … }`, `.board u-widget { … }`)
or its `style` attribute. Each widget declares its defaults on its own host (`:host { --u-widget-*: … }`), and a value
inherited from an ancestor (`:root`, a wrapper `div`) never beats a declaration on the element itself — set there, the
defaults stay. A rule in the page that selects the element does win: the page's styles come before the shadow tree's.

```css
/* a brand accent for every widget on the page */
u-widget { --u-widget-primary: #0f766e; }
```

```html
<!-- or one widget: an inline style on the element -->
<u-widget style="--u-widget-primary: #e11d48; --u-widget-on-primary: #fff"></u-widget>
```

Setting `--u-widget-primary` alone leaves the first chart series (`--u-widget-chart-color-1`) and the ink on a primary
fill (`--u-widget-on-primary`) at their defaults — set them with it when the accent should run through a chart too.

| Token | Default | Description |
|---|---|---|
| `--u-widget-text` | `#1a1a2e` | Primary text |
| `--u-widget-text-secondary` | `#64748b` | Secondary text |
| `--u-widget-primary` | `#4f46e5` | Accent color |
| `--u-widget-positive` | `#16a34a` | Positive indicator |
| `--u-widget-negative` | `#dc2626` | Negative indicator |
| `--u-widget-bg` | `#fff` | Background |
| `--u-widget-surface` | `#f1f5f9` | Surface / hover |
| `--u-widget-border` | `#e2e8f0` | Borders |
| `--u-widget-font-family` | `system-ui, …` | Body face — charts read it too |
| `--u-widget-font-display` | the body face | Titles, the `header` widget, a stamp |
| `--u-widget-font-numeric` | the body face | Figures — a metric's value, a gauge's reading, a right-aligned table column (digits of one width) |
| `--u-widget-tone-ok` … `--u-widget-tone-next` | see [Tones](#tones) | A state's colour |

### Skin — a page's own look

A page that has a look of its own — a paper ledger, a neon sign, an engraved plate — sets it as tokens on the widgets,
and every widget reads the same ones, charts included: the paper is `--u-widget-bg`, the ink `--u-widget-text`, the
faint ink `--u-widget-text-secondary`, the rules `--u-widget-border`, with the three faces above, `--u-widget-radius` and
`--u-widget-shadow`. Set on the element, they win over the theme — a paper card in a dark page keeps its dark ink, and a
chart on it draws its labels in that ink, not the dark theme's. Give such a widget the `theme` of its paper, not of the
page — `theme="light"` on a light paper in a dark page — so the tone colours are the ones made for a light ground.

`options.frame` draws the widget, with its title, in a panel of that paper — so a page need not draw one under it:

| Frame | Looks like |
|---|---|
| `card` | a surface with a border and the shadow |
| `flat` | the surface alone |
| `glow` | a card with a halo in the accent (or in `--tone`, when the page sets it) |
| `plate` | a heavy rule with an inner hairline — an engraved plate |
| `ticket` | scalloped top and bottom edges — a ticket stub |
| `postage` | perforated all round — a stamp |
| `tape` | a sheet stuck on slightly askew |

```html
<u-widget style="--u-widget-bg:#f4ecd8; --u-widget-text:#2b2118; --u-widget-font-display:'Playfair Display', serif"
  spec='{"widget":"metric","title":"Takings","data":{"value":1284},"options":{"frame":"ticket"}}'></u-widget>
```

In a `compose`, `options.frame` draws every child in that frame. A word that is not a frame draws none and warns once.

### Dark mode

```css
.dark u-widget {
  --u-widget-text: #e2e8f0;
  --u-widget-text-secondary: #94a3b8;
  --u-widget-primary: #818cf8;
  --u-widget-bg: #1e1e2e;
  --u-widget-surface: #2a2a3e;
  --u-widget-border: #374151;
}
```

### 페이지 테마 자동 동기화 (`data-theme` · `theme`)

`u-widgets`를 import하면 `installGlobalThemeSync()`가 **자동 실행**된다(옵트인 불필요). 이 함수는:

- `document.documentElement`의 `data-theme` 속성과 `theme` 속성(`@iyulab/components`의 `Theme`이 쓰는 이름)을 `MutationObserver`로 감시 — 둘 다 있으면 `data-theme`이 이긴다
- 새로 추가되는 `<u-widget>` 노드를 감시(`document.body` 하위 `childList`/`subtree`)
- 페이지가 테마를 **선언했을 때만**(`data-theme`/`theme`이 `"dark"` 또는 `"light"`) 모든 `<u-widget>`에 같은 `theme` 속성을 전파

```html
<html data-theme="dark">
  <!-- 이 안의 모든 <u-widget>이 자동으로 theme="dark"를 받는다 -->
</html>
```

- **선언이 없으면**(`data-theme` 없음, 또는 `dark`·`light`가 아닌 값) `theme` 속성을 쓰지 않는다 — 위젯은 auto 모드로 `prefers-color-scheme`(와 페이지의 `color-scheme`)를 따른다. 선언이 사라지면 동기화가 썼던 `theme`을 걷어 auto로 돌아간다.
- **위젯에 직접 준 `theme`은 페이지의 것**이다 — `<u-widget theme="light">`처럼 지정하면(동기화가 쓴 뒤 바꾼 경우 포함) 동기화가 덮어쓰거나 걷지 않는다.
- **이미 그린 차트도 따라온다.** 차트는 캔버스라 그릴 때 읽은 색을 쥐고 있다 — `<html>`·`<body>`의 속성이나 클래스(`dark` 등)가 바뀌거나 시스템 색 구성표(`prefers-color-scheme`)가 바뀌면 차트가 읽는 토큰(`--u-widget-chart-color-N` · `--u-widget-text` · `--u-widget-text-secondary` · `--u-widget-border` · `--u-widget-bg`)을 다시 읽고, 값이 달라졌을 때만 다시 그린다. 그래서 속성 이름이 무엇이든(클래스 기반 다크 모드 포함) 테마 브리지 시트를 쓰는 페이지의 전환이 차트에 닿는다.

**직접 `installGlobalThemeSync`를 호출하거나 동일한 `MutationObserver`를 재구현할 필요가 없다** — 별도의 테마 동기화 로직을 앱에서 구현하면 동일 DOM을 감시하는 옵저버가 중복 설치되어 오버헤드가 배가된다.

### Shadcn/ui + Tailwind 통합

Shadcn/ui 또는 Tailwind CSS 4 프로젝트에서는 공식 프리셋을 임포트하세요:

```css
/* globals.css 최상단 (Shadcn globals.css 다음) */
@import "@iyulab/u-widgets/themes/shadcn.css";
```

이 프리셋은 `--u-widget-*` 변수를 Shadcn의 `--primary`, `--background` 등에 자동 매핑합니다.
다크모드는 Shadcn의 `.dark` 클래스 전환과 함께 자동으로 적용됩니다.

## Developer Tools

```ts
import { help, template, suggestMapping, autoSpec } from '@iyulab/u-widgets/tools';

help();                              // List all widget types
help('chart.bar');                   // Specific widget info
template('metric');                  // Minimal template with sample data
suggestMapping([{ name: 'A', value: 30 }]); // Suggest widget + mapping
autoSpec(data);                      // One-call auto spec from data
```

`validate(spec)` returns `errors` (English messages) and the same errors as `issues` — `{ code, params, path }` —
so a host can branch on `code` or show the message in its reader's language with
`specErrorMessage(issue, getLocaleStrings(lang))`. The "Invalid widget spec" card lists them in the widget's locale.

`checkSpec(spec)` (in `./tools`) answers in the same shape and also holds a hand-written spec to the catalog — for an
editor or a tool that writes specs, before showing one. A widget the library does not have is an error
(`widget-unknown`, with a "did you mean" warning for a near spelling); a top-level key no widget reads, an option the
widget does not have and an option value of the wrong type are warnings, each naming what that place takes:

```ts
import { checkSpec } from '@iyulab/u-widgets/tools';

checkSpec({ widget: 'list', data: [], options: { compact: 'yes', dense: true } }).warnings;
// → ['options.compact should be a boolean, not "yes"', 'options.dense is not an option of list — it takes compact']
```

### 속성 편집기용 메타데이터

위젯 spec을 사람이 고치는 편집기(속성 패널, 디자이너)는 위젯 지식을 복제하지 않고 이 메타데이터로 컨트롤을 만든다.

```ts
import { getWidgetOptions, getWidgetDataFields, getWidgetLabel } from '@iyulab/u-widgets/tools';

getWidgetOptions('gauge');
// → [{ key: 'min', label: 'Minimum', desc: 'Minimum range value', type: 'number', default: 0 },
//    { key: 'max', label: 'Maximum', ..., type: 'number', default: 100 },
//    { key: 'unit', label: 'Unit', ..., type: 'string' },
//    { key: 'thresholds', ..., type: '{ to: number, color: string, label?: string }[]' }, ...]

getWidgetDataFields('status');
// → [{ key: 'label', label: 'Label', type: 'string', ... },
//    { key: 'tone', label: 'Tone', type: '"ok" | "info" | ...', enum: ['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'accent', 'past', 'now', 'next'] }, ...]

getWidgetLabel('chart.bar');   // → 'Bar chart'
```

- `type`은 TypeScript 표기(`number`, `string`, `boolean`, `string[]`, 리터럴 유니온 …). 선택지가 고정된 값은 `enum`으로도 준다.
- `default`는 위젯 코드가 그 값을 정해 둔 옵션에만 있다 — 없으면 "생략 시 위젯이 알아서 정함"이다.
- `help(widget).options`도 같은 목록이다. 옵션 이름의 위젯별 차이(예: `rating`의 `max`는 아이콘 개수)는 `desc`에 반영된다.
- `label`은 폼 라벨로 쓰는 짧은 이름이다(`desc`는 설명). 위젯별 의미가 좁은 키는 그 위젯에서 이름이 따로 있다(`rating`의 `max` → "Icons").
- 이름은 지역화된다. `getWidgetOptions(widget, locale)`·`getWidgetDataFields(widget, locale)`·`getWidgetLabel(widget, locale)`의 `locale`은 위젯의 로케일과 같은 순서로 정해진다(인자 → `setDefaultLocale()` → `<html lang>`). 한국어 이름은 `import '@iyulab/u-widgets/tools/locales/ko'`로 등록되고, 다른 언어는 `registerToolLabels(lang, { widgets, options, dataFields, widgetOptions, widgetDataFields })`로 등록한다(빠진 이름은 영어). `WIDGET_DATA_FIELDS`·`help()`의 이름은 영어다.

## Host Integration

### Attribute (JSON 문자열)

CDN 또는 HTML에서 사용:

```html
<u-widget spec='{"widget":"metric","data":{"value":42}}'></u-widget>
```

### Property (JavaScript 객체)

JavaScript/TypeScript에서 객체 직접 할당:

```javascript
const el = document.querySelector('u-widget');
el.spec = { widget: 'metric', data: { value: 42 } };
```

React에서 ref를 통한 property 설정:

```tsx
import { useRef, useEffect } from 'react';

import type { UWidgetSpec } from '@iyulab/u-widgets';

function Widget({ spec }: { spec: UWidgetSpec }) {
  const ref = useRef<HTMLElementTagNameMap['u-widget']>(null);
  useEffect(() => {
    if (ref.current) ref.current.spec = spec;
  }, [spec]);
  return <u-widget ref={ref} />;
}
```

> **참고:** React JSX에서 `<u-widget spec={obj} />`처럼 전달하면 React가 객체를
> `[object Object]`로 직렬화합니다. `ref.current.spec = obj` 방식을 사용하세요.

### 이벤트 수신

```javascript
el.addEventListener('u-widget-event', (e) => {
  console.log(e.detail); // { type, widget, id?, action?, data? }
});
```

## Framework Integration

- [Next.js (App Router)](integrations/nextjs.md)
