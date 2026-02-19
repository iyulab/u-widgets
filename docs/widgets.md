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
| `metric` | Single KPI value | — (uses data shape) |
| `stat-group` | Multiple KPIs in a row | — (uses data shape) |
| `gauge` | Gauge with thresholds | — (uses `data.value`) |
| `progress` | Progress bar | — (uses `data.value`) |
| `table` | Data table (sortable) | `columns` (auto-inferred) |
| `list` | Structured list | `primary`, `secondary`, `avatar`, `trailing` |
| `code` | Syntax-highlighted code | — (uses `data.content`) |
| `citation` | Source/reference cards | — (uses data array) |
| `status` | Inline status badge | — (uses `data.label`, `data.variant`) |
| `steps` | Multi-step progress | — (uses data array) |
| `rating` | Star/heart/thumb rating | — (uses `data.value`) |
| `video` | HTML5 video player | — (uses `data.src`) |
| `gallery` | Image gallery grid | — (uses data array) |
| `kv` | Key-value pairs | — (uses data object) |

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

// Table
"mapping": { "columns": [{ "field": "id", "label": "ID", "format": "number", "align": "right" }] }

// List
"mapping": { "primary": "name", "secondary": "description", "avatar": "imageUrl", "trailing": "score" }
```

## Format Hints

| Format | Output |
|---|---|
| `number` | `1,234` |
| `currency` | `₩1,234` |
| `percent` | `73%` |
| `date` | `2025-01-15` |
| `datetime` | `2025-01-15 14:30` |
| `bytes` | `1.2 GB` |

## Chart Options

| Option | Type | Applies To | Description |
|---|---|---|---|
| `stacked` | `boolean` | bar, line, area | Stack series |
| `horizontal` | `boolean` | bar, line, scatter | Swap axes |
| `smooth` | `boolean` | line, area | Smooth curves |
| `donut` | `boolean` | pie | Donut chart |
| `showLabel` | `boolean` | pie | Show data labels |
| `echarts` | `object` | all charts | Raw ECharts option passthrough |

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

Modifiers: `*` = required, `(Label)` = display label, `{a,b}` = options.

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
  --u-widget-bg: #1e293b;
  --u-widget-surface: #334155;
  --u-widget-border: #475569;
}
```

## Developer Tools

```ts
import { help, template, suggestMapping, autoSpec } from '@iyulab/u-widgets/tools';

help();                              // List all widget types
help('chart.bar');                   // Specific widget info
template('metric');                  // Minimal template with sample data
suggestMapping([{ name: 'A', value: 30 }]); // Suggest widget + mapping
autoSpec(data);                      // One-call auto spec from data
```
