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
  // For math expression support (requires katex peer dependency):
  // import '@iyulab/u-widgets/math';
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
| `math` | LaTeX math expressions (requires `katex`) |
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

// Math (requires u-widgets/math entry point)
{ "widget": "math", "data": { "expression": "E = mc^2" } }

// Compose
{ "widget": "compose", "layout": "grid", "children": [{ "widget": "metric", "data": { "value": 42 } }, { "widget": "gauge", "data": { "value": 73 } }] }
```

## Chart Options

XY charts (`chart.bar`, `chart.line`, `chart.area`, `chart.scatter`) support declarative options that eliminate the need for ECharts passthrough:

### Reference Lines

```json
{
  "widget": "chart.line",
  "data": [{ "month": "Jan", "rate": 82 }, { "month": "Feb", "rate": 105 }],
  "options": {
    "referenceLines": [
      { "axis": "y", "value": 100, "label": "Target", "color": "#16a34a", "style": "dashed" }
    ]
  }
}
```

### Per-Series Styles

```json
{
  "widget": "chart.line",
  "data": [{ "month": "Jan", "orders": 150, "qa": 80, "support": 45 }],
  "mapping": { "x": "month", "y": ["orders", "qa", "support"] },
  "options": {
    "series": [
      { "color": "#f97316" },
      { "color": "#8b5cf6" },
      { "color": "#3b82f6", "lineStyle": { "type": "dashed" } }
    ]
  }
}
```

Each entry in `options.series` maps 1:1 to the `mapping.y` array. Supported overrides: `color`, `lineStyle`, `symbol`, `label`, `type`, `yAxisIndex`.

### Axis Label Format

```json
{
  "widget": "chart.bar",
  "data": [{ "month": "Jan", "revenue": 12000000 }],
  "options": {
    "yFormat": { "type": "currency", "currency": "KRW" },
    "locale": "ko-KR"
  }
}
```

`xFormat` / `yFormat` accept: `type` (`number`, `currency`, `percent`, `date`, `bytes`), `prefix`, `suffix`, `currency`, `decimals`.

## Events

```js
widget.addEventListener('u-widget-event', (e) => {
  console.log(e.detail); // { type, widget, id?, action?, data? }
});
```

## React

`@iyulab/u-widgets/react` 서브패스가 `<u-widget>`의 일급 React 래퍼 `UWidget`을 제공합니다. `spec`을 문자열로 직렬화(`JSON.stringify`)하지 않고 객체 prop으로 그대로 넘길 수 있으며, `u-widget-event`는 `onWidgetEvent` 콜백 prop으로 노출됩니다.

베이스 패키지를 별도로 import해 커스텀 엘리먼트를 등록해야 합니다. `@lit/react`·`react`는 peerDependency이므로 함께 설치합니다.

```bash
npm install @iyulab/u-widgets @lit/react react
```

```tsx
import '@iyulab/u-widgets';                        // <u-widget> 등록 (side-effect)
import { UWidget } from '@iyulab/u-widgets/react';
import type { UWidgetSpec } from '@iyulab/u-widgets/react';

function Dashboard() {
  return (
    <UWidget
      spec={{ widget: 'stat-group', data: { value: 42 } }}
      onWidgetEvent={(e) => console.log(e.detail)} // e.detail: UWidgetEvent
    />
  );
}
```

- `UWidgetSpec`/`UWidgetEvent`/`UWidgetAction` 타입도 함께 re-export됩니다. `onWidgetEvent`은 `CustomEvent`를 받고 `e.detail`이 `UWidgetEvent` 페이로드입니다.
- 손수 `<u-widget spec={JSON.stringify(spec)} />` 래퍼를 만들 필요가 없습니다 — 이 공식 래퍼가 객체 spec·타입드 이벤트를 처리합니다.

## MCP Server

AI assistants can use u-widgets via [MCP server](docs/mcp-server.md):

```bash
npx @iyulab/u-widgets-mcp
```

## Framework Integration

u-widgets is a browser-only Web Component library — it requires DOM APIs (`customElements`, `HTMLElement`) and cannot run in Node.js or server-side environments.

### Next.js (App Router)

Wrap the official `UWidget` React wrapper (위 [React](#react) 참고) in a client component so it registers the element and stays out of Server Components:

```tsx
// components/widget.tsx
"use client";
import "@iyulab/u-widgets";                        // <u-widget> 등록
import { UWidget } from "@iyulab/u-widgets/react";
import type { UWidgetSpec } from "@iyulab/u-widgets/react";

export function Widget({ spec }: { spec: UWidgetSpec }) {
  return <UWidget spec={spec} />;
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
