# u-widgets

[![npm](https://img.shields.io/npm/v/@iyulab/u-widgets)](https://www.npmjs.com/package/@iyulab/u-widgets)
[![npm MCP](https://img.shields.io/npm/v/@iyulab/u-widgets-mcp?label=mcp)](https://www.npmjs.com/package/@iyulab/u-widgets-mcp)
[![license](https://img.shields.io/npm/l/@iyulab/u-widgets)](LICENSE)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/@iyulab/u-widgets/badge)](https://www.jsdelivr.com/package/npm/@iyulab/u-widgets)

Declarative, data-driven widget system for visualization and input.

Define your data. Map it to visual channels. The renderer does the rest.

```json
{
  "widget": "chart.bar",
  "data": [
    { "name": "A", "value": 30 },
    { "name": "B", "value": 70 },
    { "name": "C", "value": 45 }
  ]
}
```

That's a complete bar chart. Mapping is auto-inferred from data shape.

## Installation

```bash
npm install @iyulab/u-widgets
```

```html
<script type="module">
  import '@iyulab/u-widgets';
  // For chart support (requires echarts peer dependency):
  // import '@iyulab/u-widgets/charts';
</script>

<u-widget .spec=${{ widget: 'metric', data: { value: 42, unit: 'users' } }}></u-widget>
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@iyulab/u-widgets/dist/u-widgets.global.js"></script>
```

## Widget Types

| Widget | Purpose |
|---|---|
| `chart.bar`, `chart.line`, `chart.area`, `chart.pie`, `chart.scatter`, `chart.radar` | Data visualization |
| `metric`, `stat-group` | KPI numbers |
| `gauge`, `progress` | Value within range |
| `table`, `list`, `kv` | Structured data |
| `code`, `citation`, `status`, `steps`, `rating`, `video`, `gallery` | Content display |
| `form`, `confirm` | User input |
| `compose` | Widget composition |

## Quick Examples

```json
// Metric
{ "widget": "metric", "data": { "value": 1284, "unit": "EA", "change": 12.5, "trend": "up" } }

// Table (columns auto-inferred)
{ "widget": "table", "data": [{ "name": "Alice", "role": "Engineer" }, { "name": "Bob", "role": "Designer" }] }

// Form
{ "widget": "form", "fields": [{ "field": "name", "type": "text", "required": true }], "actions": [{ "label": "Submit", "action": "submit" }] }

// Compose
{ "widget": "compose", "layout": "grid", "children": [{ "widget": "metric", "data": { "value": 42 } }, { "widget": "gauge", "data": { "value": 73 } }] }
```

## Events

```js
widget.addEventListener('u-widget-event', (e) => {
  console.log(e.detail); // { type, widget, id?, action?, data? }
});
```

## MCP Server

AI assistants can use u-widgets via [MCP server](docs/mcp-server.md):

```bash
npx @iyulab/u-widgets-mcp
```

## Framework Integration

u-widgets is a browser-only Web Component library — it requires DOM APIs (`customElements`, `HTMLElement`) and cannot run in Node.js or server-side environments.

### Next.js (App Router)

Create a client-side wrapper component:

```tsx
// components/widget.tsx
"use client";
import "@iyulab/u-widgets";

export function Widget({ spec }: { spec: object }) {
  return <u-widget spec={JSON.stringify(spec)} />;
}
```

Use the wrapper from Server Components:

```tsx
// app/dashboard/page.tsx
import { Widget } from "@/components/widget";

export default async function Page() {
  const data = await fetchData();
  return <Widget spec={{ widget: "stat-group", data }} />;
}
```

For pages where SSR hydration mismatch is a concern, use dynamic import:

```tsx
import dynamic from "next/dynamic";
const Widget = dynamic(
  () => import("@/components/widget").then((m) => m.Widget),
  { ssr: false }
);
```

## Documentation

- [Widget Reference](docs/widgets.md) — Schema, mapping, options, theming
- [MCP Server Guide](docs/mcp-server.md) — Setup for Claude Desktop, Claude Code, VS Code

## License

MIT
