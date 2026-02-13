# u-widgets

Declarative, data-driven widget system for visualization and input.

Define your data. Map it to visual channels. The renderer does the rest.

```json
{
  "widget": "chart.bar",
  "data": [
    { "name": "A", "value": 30 },
    { "name": "B", "value": 70 },
    { "name": "C", "value": 45 }
  ],
  "mapping": { "x": "name", "y": "value" }
}
```

That's a complete bar chart.

## Why u-widgets?

**Data-first.** You declare *what* your data is and *how* it maps to visuals. You don't describe pixels, containers, or layout trees. The renderer decides the best way to present it.

**Minimal.** Every property has a sensible default. Mapping can be auto-inferred from data structure. A gauge, a chart, or a form can be expressed in a handful of JSON properties.

**Consistent.** Every widget — whether it's a line chart, a KPI metric, or an input form — follows the same envelope: `widget`, `id`, `data`, `mapping`, `fields`, `options`, `actions`. Learn one pattern, use it everywhere.

**Two modes, one schema.** Display widgets (charts, gauges, tables) and input widgets (forms, confirmations) share the same structure. A dashboard and a form live side by side in the same spec.

## Installation

```bash
npm install u-widgets
```

### Usage

```html
<!-- Import the library -->
<script type="module">
  import 'u-widgets';
  // For chart support (requires echarts peer dependency):
  // import 'u-widgets/charts';
</script>

<!-- Use the widget -->
<u-widget id="my-widget"></u-widget>

<script>
  document.getElementById('my-widget').spec = {
    widget: 'metric',
    data: { value: 42, unit: 'users', change: 12.5, trend: 'up' }
  };
</script>
```

## Quick Start

### Display: Show a metric

```json
{
  "widget": "metric",
  "data": { "value": 1284, "unit": "EA", "change": 12.5, "trend": "up" }
}
```

### Display: Line chart with multiple series

```json
{
  "widget": "chart.line",
  "title": "Monthly Revenue",
  "data": [
    { "month": "Jan", "sales": 100, "cost": 60 },
    { "month": "Feb", "sales": 120, "cost": 65 },
    { "month": "Mar", "sales": 90,  "cost": 55 }
  ],
  "mapping": { "x": "month", "y": ["sales", "cost"] }
}
```

### Display: Gauge with thresholds

```json
{
  "widget": "gauge",
  "title": "CPU Usage",
  "data": { "value": 73 },
  "options": {
    "min": 0, "max": 100, "unit": "%",
    "thresholds": [
      { "to": 60, "color": "green" },
      { "to": 80, "color": "yellow" },
      { "to": 100, "color": "red" }
    ]
  }
}
```

### Display: Table (auto-inferred columns)

```json
{
  "widget": "table",
  "data": [
    { "name": "Alice", "role": "Engineer", "status": "Active" },
    { "name": "Bob",   "role": "Designer", "status": "Away" }
  ]
}
```

No mapping needed — columns are inferred from data keys. Click column headers to sort.

### Display: List with avatars

```json
{
  "widget": "list",
  "data": [
    { "name": "Alice", "role": "Engineer", "avatar": "https://i.pravatar.cc/32?u=alice", "score": 95 },
    { "name": "Bob",   "role": "Designer", "avatar": "https://i.pravatar.cc/32?u=bob",   "score": 82 }
  ],
  "mapping": { "primary": "name", "secondary": "role", "avatar": "avatar", "trailing": "score" }
}
```

### Input: Form

```json
{
  "widget": "form",
  "title": "Create Issue",
  "data": { "priority": "medium" },
  "fields": [
    { "field": "title",    "label": "Title",    "type": "text", "required": true },
    { "field": "priority", "label": "Priority", "type": "select",
      "options": ["low", "medium", "high", "critical"] },
    { "field": "dueDate",  "label": "Due Date", "type": "date" }
  ],
  "actions": [
    { "label": "Submit", "action": "submit" },
    { "label": "Cancel", "action": "cancel" }
  ]
}
```

The `data` object provides default values — `priority` will be pre-filled with `"medium"`. Form fields are defined in top-level `fields` (not inside `mapping`).

### Input: Form (formdown shorthand)

The same form can be expressed in ~70% fewer tokens using formdown syntax:

```json
{
  "widget": "form",
  "title": "Create Issue",
  "data": { "priority": "medium" },
  "formdown": "@title*(Title): []\n@priority{low,medium,high,critical}(Priority): s[]\n@dueDate(Due Date): d[]\n@[submit \"Submit\"]\n@[cancel \"Cancel\"]"
}
```

**formdown markers:**

| Marker | Type | Example |
|---|---|---|
| `[]` | text | `@name*: []` |
| `@[]` | email | `@email: @[]` |
| `#[]` | number | `@age: #[min=18]` |
| `?[]` | password | `@pwd: ?[]` |
| `T4[]` | textarea (4 rows) | `@message: T4[]` |
| `d[]` | date | `@birth: d[]` |
| `s[]` | select | `@role{a,b,c}: s[]` |
| `r[]` | radio | `@size{S,M,L}: r[]` |
| `c[]` | checkbox | `@skills{JS,TS}: c[]` |

Modifiers: `*` = required, `(Label)` = display label, `{a,b}` = options.
Actions: `@[submit "Label"]`, `@[cancel "Label"]`.

`formdown` and `fields` are mutually exclusive. When both are present, `fields` takes precedence.

## Schema

### Envelope

Every u-widget follows a single, consistent structure:

```jsonc
{
  "widget": "<widget-type>",   // only required field
  "data": { ... },             // inline data (object or array)
  "mapping": { ... },          // data field → visual channel (auto-inferred if omitted)
  "fields": [ ... ],           // form/confirm field definitions (input only)
  "options": { ... },          // rendering hints
  "actions": [ ... ],          // user interactions
  "id": "",                    // unique identifier (for compose children, events)
  "title": "",                 // optional title
  "description": "",           // optional description
  "type": "u-widget",          // for interchange format (optional)
  "version": "0.1"             // for interchange format (optional)
}
```

Only `widget` is required. All other fields are optional. `type` and `version` are included when storing JSON to a file or exchanging with external systems; they can be omitted when the host context is clear (e.g., inside `<u-widget>`).

### Widget Types

Widget types use dot notation (`category.variant`) for extensibility.

#### Display

| Widget | Purpose | Required Mapping |
|---|---|---|
| `chart.bar` | Bar chart | `x`, `y` |
| `chart.line` | Line chart | `x`, `y` |
| `chart.area` | Area chart | `x`, `y` |
| `chart.pie` | Pie / donut chart | `label`, `value` |
| `chart.scatter` | Scatter plot | `x`, `y` |
| `chart.radar` | Radar chart | `axis`, `value` |
| `metric` | Single KPI value | — (uses data shape) |
| `stat-group` | Multiple KPIs in a row | — (uses data shape) |
| `gauge` | Gauge with thresholds | — (uses `data.value`) |
| `progress` | Progress bar | — (uses `data.value`) |
| `table` | Data table (sortable) | `columns` (auto-inferred) |
| `list` | Structured list | `primary`, `secondary`, `avatar`, `trailing` |

#### Input

| Widget | Purpose |
|---|---|
| `form` | Data entry with typed fields |
| `confirm` | Yes/no confirmation dialog |

#### Composition

| Widget | Purpose |
|---|---|
| `compose` | Combine multiple widgets into a single card |

### Mapping Channels

Mapping connects data fields to visual roles:

```jsonc
// Chart
"mapping": {
  "x": "fieldName",
  "y": "fieldName",           // or ["field1", "field2"] for multi-series
  "color": "fieldName",       // color grouping
  "size": "fieldName"         // size encoding (scatter)
}

// Table
"mapping": {
  "columns": [
    { "field": "id", "label": "ID", "format": "number", "align": "right" }
  ]
}

// List
"mapping": {
  "primary": "name",          // main text
  "secondary": "description", // subtitle
  "avatar": "imageUrl",       // circular avatar image
  "icon": "category",         // letter icon (fallback when no avatar)
  "trailing": "score"         // right-aligned value
}

// Form (top-level fields, not inside mapping)
"fields": [
  { "field": "name", "label": "Name", "type": "text", "required": true }
]
```

When mapping is omitted, the renderer infers it from data structure:
- First string field → `x`, first number field → `y`
- All object keys → table columns
- All object keys → text input fields

### Format Hints

| Format | Output |
|---|---|
| `number` | `1,234` |
| `currency` | `₩1,234` |
| `percent` | `73%` |
| `date` | `2025-01-15` |
| `datetime` | `2025-01-15 14:30` |
| `bytes` | `1.2 GB` |

### Actions

```jsonc
"actions": [
  { "label": "Submit", "action": "submit", "style": "primary" },
  { "label": "Delete", "action": "submit", "style": "danger" },
  { "label": "Cancel", "action": "cancel" }
]
```

Reserved actions: `submit`, `cancel`, `navigate`. Custom action strings are forwarded to the host application.

## Composition

Combine widgets into a dashboard with `compose`:

```json
{
  "widget": "compose",
  "title": "Server Dashboard",
  "layout": "grid",
  "children": [
    {
      "widget": "stat-group",
      "span": 2,
      "data": [
        { "label": "CPU", "value": 73, "suffix": "%" },
        { "label": "Memory", "value": 85, "suffix": "%" },
        { "label": "Disk", "value": 42, "suffix": "%" }
      ]
    },
    {
      "widget": "chart.line",
      "span": 2,
      "data": [
        { "time": "10:00", "cpu": 65, "mem": 80 },
        { "time": "10:05", "cpu": 72, "mem": 83 },
        { "time": "10:10", "cpu": 73, "mem": 85 }
      ],
      "mapping": { "x": "time", "y": ["cpu", "mem"] }
    },
    {
      "widget": "gauge",
      "title": "Temperature",
      "data": { "value": 42 },
      "options": {
        "min": 0, "max": 80, "unit": "°C",
        "thresholds": [
          { "to": 50, "color": "green" },
          { "to": 65, "color": "yellow" },
          { "to": 80, "color": "red" }
        ]
      }
    },
    {
      "widget": "table",
      "title": "Recent Alerts",
      "data": [
        { "time": "10:42", "source": "web-03", "message": "High latency", "level": "warning" },
        { "time": "10:38", "source": "db-01",  "message": "Connection pool exhausted", "level": "critical" }
      ]
    }
  ]
}
```

Layout modes: `stack` (vertical, default), `row` (horizontal), `grid` (with `span`). Grid accepts an optional `columns` property (default: 2) to set the number of columns.

Children inherit `type` and `version` from the parent — no need to repeat them.

## Compact Notation

u-widgets is designed around sensible defaults. Only declare what deviates.

The compact form IS the default — only declare what deviates:

- **`mapping`** — Omit when data structure is self-evident (renderer auto-infers)
- **`options`** — Only specify values that differ from defaults
- **`title`, `description`** — Omit when not needed
- **`type`, `version`** — Only include for file storage or interchange

### Widget selection guide

| Data shape | Recommended widget |
|---|---|
| Single number + delta | `metric` |
| Multiple single numbers | `stat-group` |
| Number within a range | `gauge` or `progress` |
| Category × value | `chart.bar` |
| Time series × value | `chart.line` |
| Proportions | `chart.pie` |
| Two numeric dimensions | `chart.scatter` |
| Record list | `table` |
| User input needed | `form` |
| Yes/no confirmation | `confirm` |
| Multiple widgets | `compose` |

## Events

Widgets communicate with the host application through a simple event interface:

```typescript
interface UWidgetEvent {
  type: "submit" | "action" | "change" | "select";
  widget: string;
  id?: string;
  action?: string;
  data?: Record<string, any>;
}
```

| Event | Trigger | Payload |
|---|---|---|
| `submit` | Form submit button | Form field values |
| `action` | Custom action button | Action data |
| `change` | Input value change | Changed field and value |
| `select` | Chart element click | Selected data point |

Listen via the `u-widget-event` custom event:

```js
document.querySelector('u-widget').addEventListener('u-widget-event', (e) => {
  console.log(e.detail); // { type, widget, id?, action?, data? }
});
```

Required fields are validated on submit — the event won't fire until all required fields are filled.

## Theming

u-widgets uses CSS custom properties for theming. Set these on any ancestor element to customize appearance:

| Token | Default | Description |
|---|---|---|
| `--u-widget-text` | `#1a1a2e` | Primary text color |
| `--u-widget-text-secondary` | `#64748b` | Secondary / label text |
| `--u-widget-primary` | `#4f46e5` | Primary accent (buttons, gauge fill, focus rings) |
| `--u-widget-positive` | `#16a34a` | Positive indicator (trend up) |
| `--u-widget-negative` | `#dc2626` | Negative indicator (trend down, danger) |
| `--u-widget-bg` | `#fff` | Widget background |
| `--u-widget-surface` | `#f1f5f9` | Surface / hover background |
| `--u-widget-border` | `#e2e8f0` | Border and divider color |
| `--u-widget-gap` | `16px` | Compose layout gap |
| `--u-widget-chart-height` | `300px` | Chart container height |
| `--u-widget-chart-color-{1..10}` | (ECharts defaults) | Chart color palette |

### Dark mode example

```css
.dark {
  --u-widget-text: #e2e8f0;
  --u-widget-text-secondary: #94a3b8;
  --u-widget-primary: #818cf8;
  --u-widget-positive: #4ade80;
  --u-widget-negative: #f87171;
  --u-widget-bg: #1e293b;
  --u-widget-surface: #334155;
  --u-widget-border: #475569;
}
```

## Chart Options

Chart widgets (`chart.*`) support these convenience options:

| Option | Type | Applies To | Description |
|---|---|---|---|
| `stacked` | `boolean` | bar, line, area | Stack series on top of each other |
| `horizontal` | `boolean` | bar, line, scatter | Swap x/y axes for horizontal layout |
| `smooth` | `boolean` | line, area | Smooth curve interpolation |
| `donut` | `boolean` | pie | Render as donut chart (hole in center) |
| `showLabel` | `boolean` | pie | Show/hide data labels (default: true) |
| `echarts` | `object` | all charts | Raw ECharts option passthrough (deep-merged) |

### ECharts passthrough

For advanced customization, pass raw ECharts options via `options.echarts`. These are merged one level deep into the generated option:

```json
{
  "widget": "chart.bar",
  "data": [{ "month": "Jan", "sales": 100 }],
  "options": {
    "stacked": true,
    "echarts": {
      "xAxis": { "name": "Month" },
      "yAxis": { "name": "Sales ($)" },
      "title": { "text": "Monthly Sales" }
    }
  }
}
```

## Table Options

| Option | Type | Default | Description |
|---|---|---|---|
| `sortable` | `boolean` | `true` | Enable column sorting (click headers to sort) |

Sorting cycles through: ascending → descending → original order.

## Renderer Contract

Implementations of u-widgets renderers must:

1. **Fallback gracefully** — Unknown widget types render as raw JSON or a generic card
2. **Auto-infer mapping** — When mapping is omitted, infer from data structure
3. **Apply defaults** — Every option has a reasonable default
4. **Be responsive** — Adapt to container size
5. **Respect themes** — Honor host application's light/dark mode and color scheme
6. **Support accessibility** — ARIA attributes, keyboard navigation

## Comparison with Adaptive Cards

| Aspect | Adaptive Cards | u-widgets |
|---|---|---|
| Focus | Layout-first (`body` → elements) | Data-first (`data` → `mapping`) |
| Charts/gauges | Not built-in | First-class citizens |
| Verbosity | Verbose (layout tree) | Compact (data + mapping) |
| Auto-inference | None | Mapping inferred from data shape |
| Type system | Flat (`TextBlock`, `Image`) | Hierarchical dot notation (`chart.bar`) |
| Input | Inline `Input.*` elements | Dedicated `form` widget |
| Composition | Nested containers | `compose` with layout hints |

## License

MIT

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.