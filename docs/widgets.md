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
| `chart.radar` | Radar chart | `axis`, `value` |
| `chart.heatmap` | 히트맵 | `x`, `y`, `value` |
| `chart.box` | 박스플롯 | `x`, `low`, `q1`, `median`, `q3`, `high` |
| `chart.funnel` | 깔때기 차트 | `label`, `value` |
| `chart.waterfall` | 폭포 차트 | `x`, `y`, `total?` |
| `chart.treemap` | 트리맵 | `label`, `value` |
| `chart.histogram` | Histogram (auto-binning) | `value` (or a flat `number[]`) |
| `chart.gantt` | Gantt / interval chart | `y`, `start`, `end`, `label?`, `color?` |
| `metric` | Single KPI value | — (uses data shape) |
| `stat-group` | Multiple KPIs in a row — cells never shrink below their value; overflow wraps to new rows | — (uses data shape) |
| `gauge` | Gauge with thresholds | — (uses `data.value`) |
| `progress` | Progress bar | — (uses `data.value`) |
| `table` | Data table (sortable) | `columns` (auto-inferred) |
| `list` | Structured list | `primary`, `secondary`, `avatar`, `trailing` |
| `code` | Syntax-highlighted code | — (uses `data.content`) |
| `citation` | Source/reference cards | — (uses data array) |
| `status` | Inline status badge | — (uses `data.value`, `data.label?`, `data.level`) |
| `steps` | Multi-step progress | — (uses data array) |
| `rating` | Star/heart/thumb rating | — (uses `data.value`) |
| `video` | HTML5 video player | — (uses `data.src`; subtitle / caption tracks in `data.tracks`: `[{ src, srclang?, label?, kind?, default? }]`, WebVTT) |
| `gallery` | Image gallery grid | — (uses data array) |
| `kv` | Key-value pairs | — (uses data object) |
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

// Table (optional `variant` bolds + colors a column's cells: success|warning|danger|info|neutral)
"mapping": { "columns": [{ "field": "id", "label": "ID", "format": "number", "align": "right" }, { "field": "yield", "label": "Yield", "variant": "success" }] }

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
| `number` | `1,234` |
| `currency` | `$1,234.00` (기본: USD) |
| `currency:KRW` | `₩1,234` |
| `currency:EUR` | `€1,234.00` |
| `currency:JPY` | `¥1,234` |
| `percent` | `73%` |
| `date` | `2025-01-15` |
| `datetime` | `2025-01-15 14:30` |
| `bytes` | `1.2 GB` |

`date` and `datetime` read a value written in ISO 8601 (`2025-01-15T14:30:00Z`), with a space or dots between
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
| `chart.*` | the chart canvas, which resizes with it; below about 320×260px — the canvas size decides, whether a host height or a narrow container (the 200px default inside 20rem) made it small — the chart switches to a compact layout (tight margins that keep the axis labels inside, fewer value ticks, a smaller legend — or none when the canvas is too short — and pie labels moved off the outside of the pie) | `--u-widget-chart-height` (300px; 200px inside a 20rem container) |
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

## Table Options

| Option | Type | Description |
|---|---|---|
| `pageSize` | `number` | 페이지당 행 수. 설정 시 하단 페이지 컨트롤 표시 |
| `searchable` | `boolean` | 검색 입력 필드 표시 (기본: false) |
| `sortable` | `boolean` | 컬럼 헤더 클릭으로 정렬 (기본: true) |

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
| `horizontal` | `boolean` | bar, line, scatter | Swap axes |
| `smooth` | `boolean` | line, area | Smooth curves |
| `series` | `object[]` | bar, line, area | Per-series settings, in `mapping.y` order: `label` (the name in the legend and tooltip — the field name otherwise, which is often a source's code such as `PM`), `color`, `lineStyle`, `symbol`, `type`, `yAxisIndex` |
| `donut` | `boolean` | pie | Donut chart |
| `showLabel` | `boolean` | pie, gantt | Show data labels (gantt: in-bar segment labels, default on) |
| `categories` | `string[]` | gantt | Row order top to bottom; listed rows stay on the axis without intervals |
| `echarts` | `object` | all charts | Raw ECharts option passthrough (recursively deep-merged; see below) |
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
- **`options.referenceLines`** with `axis: 'x'` draws a vertical line at a value or date
  (makespan, due date). `options.xFormat` formats the value/time axis — e.g.
  `{ type: 'date' }` on a time axis.

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

### Axis label control (interval / rotate / name)

Axis config must go under **`options.echarts`** — it is deep-merged onto the generated
axis, so the builder's category data is preserved. Placing `xAxis`/`yAxis` at the
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

Forms can use [formdown](https://github.com/iyulab/formdown) syntax for compact definitions:

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
| `T4[]` | textarea |
| `d[]` | date |
| `s[]` | select |
| `r[]` | radio |
| `c[]` | checkbox |

Modifiers: `*` = required, `(Label)` = display label, `{a,b}` = options. An option written
`value=Label` submits `value` and shows `Label` — `@kind{hw=Hardware,sw=Software}(Kind): s[]`
(`\,` and `\=` keep a comma or `=` inside an option). In a `fields` array the same option is
`{ "value": "hw", "label": "Hardware" }`; a plain string is a value shown as itself.

### Date fields and locale in an `@iyulab/components` app

`date` and `datetime` fields use the browser's native inputs, whose display follows the browser's
language. An app that already uses `@iyulab/components` can opt in to its date picker:

```ts
import '@iyulab/u-widgets';
import '@iyulab/u-widgets/components';   // needs @iyulab/components ≥ 2.8
```

The fields then render `<u-date-picker>` (typed entry, calendar, the app's locale). What the form
submits does not change: `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm` (local time) for `datetime`.

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

CSS custom properties on any ancestor element:

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

### Dark mode

```css
.dark {
  --u-widget-text: #e2e8f0;
  --u-widget-text-secondary: #94a3b8;
  --u-widget-primary: #818cf8;
  --u-widget-bg: #1e1e2e;
  --u-widget-surface: #2a2a3e;
  --u-widget-border: #374151;
}
```

### `data-theme` 자동 동기화

`u-widgets`를 import하면 `installGlobalThemeSync()`가 **자동 실행**된다(옵트인 불필요). 이 함수는:

- `document.documentElement`의 `data-theme` 속성을 `MutationObserver`로 감시
- 새로 추가되는 `<u-widget>` 노드를 감시(`document.body` 하위 `childList`/`subtree`)
- 페이지가 테마를 **선언했을 때만**(`data-theme="dark"` 또는 `"light"`) 모든 `<u-widget>`에 같은 `theme` 속성을 전파

```html
<html data-theme="dark">
  <!-- 이 안의 모든 <u-widget>이 자동으로 theme="dark"를 받는다 -->
</html>
```

- **선언이 없으면**(`data-theme` 없음, 또는 `dark`·`light`가 아닌 값) `theme` 속성을 쓰지 않는다 — 위젯은 auto 모드로 `prefers-color-scheme`(와 페이지의 `color-scheme`)를 따른다. 선언이 사라지면 동기화가 썼던 `theme`을 걷어 auto로 돌아간다.
- **위젯에 직접 준 `theme`은 페이지의 것**이다 — `<u-widget theme="light">`처럼 지정하면(동기화가 쓴 뒤 바꾼 경우 포함) 동기화가 덮어쓰거나 걷지 않는다.

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
//    { key: 'level', label: 'Level', type: '"info" | "success" | ...', enum: ['info', 'success', 'warning', 'error', 'neutral'] }, ...]

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
