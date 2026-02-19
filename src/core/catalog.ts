/**
 * Widget catalog and template generation for programmatic use.
 *
 * Designed to power an MCP server or any tool that needs
 * to list widgets, describe their capabilities, or generate
 * minimal starter specs.
 */

import type { UWidgetSpec } from './types.js';
import type { DataFieldInfo } from './widget-meta.js';
import {
  MAPPING_DOCS, OPTION_DOCS, FIELD_PROP_DOCS, ACTION_PROP_DOCS,
  WIDGET_OPTIONS, WIDGET_DATA_FIELDS, WIDGET_INFERENCE,
  getWidgetEvents,
} from './widget-meta.js';

/** Describes a single widget type in the catalog. */
export interface WidgetInfo {
  /** Widget type identifier (e.g., `"chart.bar"`). */
  widget: string;
  /** Human-readable category. */
  category: 'chart' | 'display' | 'input' | 'content' | 'composition';
  /** Short description of the widget's purpose. */
  description: string;
  /** Which mapping keys are relevant for this widget. */
  mappingKeys: string[];
  /** Expected data shape. */
  dataShape: 'object' | 'array' | 'none';
}

/** Extended detail returned when `help()` is called with an exact widget name. */
export interface WidgetDetail extends WidgetInfo {
  /** One-line hint telling LLM what can be omitted via auto-inference. */
  autoInference: string;
  /** Well-known data fields (display/content widgets). Empty for user-defined data. */
  dataFields: DataFieldInfo[];
  /** Mapping key descriptions relevant to this widget. */
  mappingDocs: Record<string, string>;
  /** Option key descriptions relevant to this widget. */
  optionDocs: Record<string, string>;
  /** Field definition property docs (form/confirm only). */
  fieldDocs?: Record<string, string>;
  /** Action property docs (form/confirm only). */
  actionDocs?: Record<string, string>;
  /** Event types emitted by this widget. */
  events: readonly string[];
  /** Example specs (minimal template + feature-rich). */
  examples: { label: string; spec: UWidgetSpec }[];
}

const CATALOG: readonly WidgetInfo[] = [
  // Charts
  // Charts
  { widget: 'chart.bar', category: 'chart', description: 'Bar chart for category × value comparison', mappingKeys: ['x', 'y'], dataShape: 'array' },
  { widget: 'chart.line', category: 'chart', description: 'Line chart for trends over a category axis', mappingKeys: ['x', 'y'], dataShape: 'array' },
  { widget: 'chart.area', category: 'chart', description: 'Area chart (filled line chart)', mappingKeys: ['x', 'y'], dataShape: 'array' },
  { widget: 'chart.pie', category: 'chart', description: 'Pie or donut chart for proportions', mappingKeys: ['label', 'value'], dataShape: 'array' },
  { widget: 'chart.scatter', category: 'chart', description: 'Scatter plot for two numeric dimensions', mappingKeys: ['x', 'y', 'color', 'size'], dataShape: 'array' },
  { widget: 'chart.radar', category: 'chart', description: 'Radar chart for multi-axis comparison', mappingKeys: ['axis', 'value'], dataShape: 'array' },
  { widget: 'chart.heatmap', category: 'chart', description: 'Heatmap for matrix data visualization', mappingKeys: ['x', 'y', 'value'], dataShape: 'array' },
  { widget: 'chart.box', category: 'chart', description: 'Box plot for statistical distribution', mappingKeys: ['x', 'y'], dataShape: 'array' },
  { widget: 'chart.funnel', category: 'chart', description: 'Funnel chart for sequential stages', mappingKeys: ['label', 'value'], dataShape: 'array' },
  { widget: 'chart.waterfall', category: 'chart', description: 'Waterfall chart for cumulative values', mappingKeys: ['x', 'y'], dataShape: 'array' },
  { widget: 'chart.treemap', category: 'chart', description: 'Treemap for hierarchical data', mappingKeys: [], dataShape: 'array' },
  // Display
  { widget: 'metric', category: 'display', description: 'Single KPI value with optional trend', mappingKeys: [], dataShape: 'object' },
  { widget: 'stat-group', category: 'display', description: 'Multiple KPI values in a row', mappingKeys: [], dataShape: 'array' },
  { widget: 'gauge', category: 'display', description: 'Arc gauge for a value within a range', mappingKeys: [], dataShape: 'object' },
  { widget: 'progress', category: 'display', description: 'Progress bar for a value within a range', mappingKeys: [], dataShape: 'object' },
  { widget: 'table', category: 'display', description: 'Sortable data table with auto-inferred columns', mappingKeys: ['columns'], dataShape: 'array' },
  { widget: 'list', category: 'display', description: 'Structured list with avatars and trailing values', mappingKeys: ['primary', 'secondary', 'avatar', 'icon', 'trailing', 'badge'], dataShape: 'array' },
  // Input
  { widget: 'form', category: 'input', description: 'Data entry form with typed fields', mappingKeys: [], dataShape: 'object' },
  { widget: 'confirm', category: 'input', description: 'Yes/no confirmation dialog', mappingKeys: [], dataShape: 'object' },
  // Content
  { widget: 'markdown', category: 'content', description: 'Render markdown text (headers, bold, italic, code, links, lists, tables)', mappingKeys: [], dataShape: 'object' },
  { widget: 'image', category: 'content', description: 'Display an image', mappingKeys: [], dataShape: 'object' },
  { widget: 'callout', category: 'content', description: 'Callout/alert banner', mappingKeys: [], dataShape: 'object' },
  // Chat / Interaction
  { widget: 'code', category: 'content', description: 'Syntax-highlighted code block with line numbers and copy button', mappingKeys: [], dataShape: 'object' },
  { widget: 'citation', category: 'content', description: 'Source/reference cards with title, URL, snippet, and source', mappingKeys: [], dataShape: 'array' },
  { widget: 'status', category: 'content', description: 'Status indicators with label, value, and level-based coloring', mappingKeys: [], dataShape: 'array' },
  { widget: 'steps', category: 'content', description: 'Multi-step progress indicator (done/active/pending/error)', mappingKeys: [], dataShape: 'array' },
  { widget: 'rating', category: 'content', description: 'Star/heart/thumb rating display or input', mappingKeys: [], dataShape: 'object' },
  { widget: 'video', category: 'content', description: 'Video player with controls, poster, and caption', mappingKeys: [], dataShape: 'object' },
  { widget: 'gallery', category: 'content', description: 'Image gallery grid with captions', mappingKeys: [], dataShape: 'array' },
  { widget: 'kv', category: 'content', description: 'Key-value pairs display (object or array of {key, value})', mappingKeys: [], dataShape: 'object' },
  { widget: 'actions', category: 'content', description: 'Standalone action buttons (quick replies, suggested actions)', mappingKeys: [], dataShape: 'none' },
  { widget: 'divider', category: 'content', description: 'Visual separator with optional label', mappingKeys: [], dataShape: 'none' },
  { widget: 'header', category: 'content', description: 'Section heading (h1–h3)', mappingKeys: [], dataShape: 'object' },
  // Composition
  { widget: 'compose', category: 'composition', description: 'Combine multiple widgets with layout hints', mappingKeys: [], dataShape: 'none' },
];

/**
 * Get the widget catalog.
 *
 * - No argument → list all widgets (`WidgetInfo[]`).
 * - Exact widget name → full detail (`WidgetDetail`).
 * - Category or prefix → filtered list (`WidgetInfo[]`).
 *
 * @example
 * ```ts
 * help()              // → all widget descriptions
 * help('chart')       // → all chart types (WidgetInfo[])
 * help('chart.bar')   // → full detail (WidgetDetail)
 * ```
 */
export function help(): WidgetInfo[];
export function help(widget: string): WidgetInfo[] | WidgetDetail;
export function help(widget?: string): WidgetInfo[] | WidgetDetail {
  if (!widget) return [...CATALOG];

  // Exact match → return WidgetDetail
  const exact = CATALOG.find((w) => w.widget === widget);
  if (exact) return buildWidgetDetail(exact);

  // Category prefix match (e.g., 'chart', 'display', 'input')
  const byCategory = CATALOG.filter((w) => w.category === widget);
  if (byCategory.length > 0) return byCategory;

  // Widget prefix match (e.g., 'chart.' matches all chart types)
  const byPrefix = CATALOG.filter((w) => w.widget.startsWith(widget));
  return byPrefix;
}

/** Template data for each widget type. */
const TEMPLATES: Record<string, UWidgetSpec> = {
  'chart.bar': {
    widget: 'chart.bar',
    data: [{ category: 'A', value: 30 }, { category: 'B', value: 70 }, { category: 'C', value: 45 }],
    mapping: { x: 'category', y: 'value' },
  },
  'chart.line': {
    widget: 'chart.line',
    data: [{ month: 'Jan', value: 100 }, { month: 'Feb', value: 120 }, { month: 'Mar', value: 90 }],
    mapping: { x: 'month', y: 'value' },
  },
  'chart.area': {
    widget: 'chart.area',
    data: [{ month: 'Jan', value: 100 }, { month: 'Feb', value: 120 }, { month: 'Mar', value: 90 }],
    mapping: { x: 'month', y: 'value' },
  },
  'chart.pie': {
    widget: 'chart.pie',
    data: [{ name: 'A', value: 40 }, { name: 'B', value: 35 }, { name: 'C', value: 25 }],
    mapping: { label: 'name', value: 'value' },
  },
  'chart.scatter': {
    widget: 'chart.scatter',
    data: [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 15 }],
    mapping: { x: 'x', y: 'y' },
  },
  'chart.radar': {
    widget: 'chart.radar',
    data: [{ axis: 'Speed', value: 80 }, { axis: 'Power', value: 90 }, { axis: 'Defense', value: 60 }],
    mapping: { axis: 'axis', value: 'value' },
  },
  'chart.heatmap': {
    widget: 'chart.heatmap',
    data: [
      { x: 'Mon', y: 'Morning', value: 10 },
      { x: 'Mon', y: 'Afternoon', value: 20 },
      { x: 'Tue', y: 'Morning', value: 15 },
      { x: 'Tue', y: 'Afternoon', value: 25 },
    ],
    mapping: { x: 'x', y: 'y', value: 'value' },
  },
  'chart.box': {
    widget: 'chart.box',
    data: [{ group: 'A', min: 10, q1: 25, median: 50, q3: 75, max: 90 }],
    mapping: { x: 'group', y: ['min', 'q1', 'median', 'q3', 'max'] },
  },
  'chart.funnel': {
    widget: 'chart.funnel',
    data: [{ stage: 'Visit', count: 1000 }, { stage: 'Click', count: 600 }, { stage: 'Purchase', count: 200 }],
    mapping: { label: 'stage', value: 'count' },
  },
  'chart.waterfall': {
    widget: 'chart.waterfall',
    data: [{ item: 'Revenue', amount: 500 }, { item: 'Cost', amount: -200 }, { item: 'Tax', amount: -50 }],
    mapping: { x: 'item', y: 'amount' },
  },
  'chart.treemap': {
    widget: 'chart.treemap',
    data: [{ name: 'Group A', value: 100 }, { name: 'Group B', value: 80 }],
  },
  'metric': {
    widget: 'metric',
    data: { value: 1284, unit: 'users', change: 12.5, trend: 'up' },
  },
  'stat-group': {
    widget: 'stat-group',
    data: [
      { label: 'Users', value: 1284, suffix: '' },
      { label: 'Revenue', value: 42000, suffix: '$' },
    ],
  },
  'gauge': {
    widget: 'gauge',
    data: { value: 73 },
    options: { min: 0, max: 100, unit: '%' },
  },
  'progress': {
    widget: 'progress',
    data: { value: 65 },
    options: { min: 0, max: 100, unit: '%' },
  },
  'table': {
    widget: 'table',
    data: [
      { name: 'Alice', role: 'Engineer', status: 'Active' },
      { name: 'Bob', role: 'Designer', status: 'Away' },
    ],
  },
  'list': {
    widget: 'list',
    data: [
      { name: 'Alice', role: 'Engineer' },
      { name: 'Bob', role: 'Designer' },
    ],
    mapping: { primary: 'name', secondary: 'role' },
  },
  'form': {
    widget: 'form',
    fields: [
      { field: 'name', label: 'Name', type: 'text', required: true },
      { field: 'email', label: 'Email', type: 'email' },
    ],
    actions: [
      { label: 'Submit', action: 'submit', style: 'primary' },
    ],
  },
  'confirm': {
    widget: 'confirm',
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    actions: [
      { label: 'Confirm', action: 'submit', style: 'danger' },
      { label: 'Cancel', action: 'cancel' },
    ],
  },
  'markdown': {
    widget: 'markdown',
    data: { content: '# Hello\n\nThis is **markdown** content.' },
  },
  'image': {
    widget: 'image',
    data: { src: 'https://placehold.co/300x200', alt: 'Placeholder image' },
  },
  'callout': {
    widget: 'callout',
    data: { content: 'This is an informational callout.', variant: 'info' },
  },
  'code': {
    widget: 'code',
    data: { content: 'const x = 42;\nconsole.log(x);', language: 'javascript' },
  },
  'citation': {
    widget: 'citation',
    data: [
      { title: 'u-widgets Documentation', url: 'https://github.com/iyulab/u-widgets', source: 'GitHub' },
    ],
  },
  'status': {
    widget: 'status',
    data: [
      { label: 'API', value: 'Operational', level: 'success' },
      { label: 'DB', value: 'Degraded', level: 'warning' },
    ],
  },
  'steps': {
    widget: 'steps',
    data: [
      { label: 'Data collection', status: 'done' },
      { label: 'Analysis', status: 'active' },
      { label: 'Report', status: 'pending' },
    ],
  },
  'rating': {
    widget: 'rating',
    data: { value: 4.2 },
  },
  'video': {
    widget: 'video',
    data: { src: 'https://example.com/demo.mp4', poster: 'https://example.com/thumb.jpg' },
  },
  'gallery': {
    widget: 'gallery',
    data: [
      { src: 'https://placehold.co/300x200', alt: 'Image 1' },
      { src: 'https://placehold.co/300x200', alt: 'Image 2' },
      { src: 'https://placehold.co/300x200', alt: 'Image 3' },
    ],
  },
  'kv': {
    widget: 'kv',
    data: { status: 'Active', plan: 'Pro', expires: '2026-03-15' },
  },
  'actions': {
    widget: 'actions',
    actions: [
      { label: 'Analyze', action: 'analyze' },
      { label: 'Export', action: 'export', style: 'primary' },
    ],
  },
  'divider': {
    widget: 'divider',
  },
  'header': {
    widget: 'header',
    data: { text: 'Section Title' },
  },
  'compose': {
    widget: 'compose',
    layout: 'grid',
    children: [
      { widget: 'metric', data: { value: 42, unit: 'items' } },
      { widget: 'metric', data: { value: 95, unit: '%' } },
    ],
  },
};

/** Feature-rich examples per widget (merged with TEMPLATES "Minimal" in buildWidgetDetail). */
const EXAMPLES: Record<string, { label: string; spec: UWidgetSpec }[]> = {
  'chart.bar': [
    {
      label: 'Stacked multi-series',
      spec: {
        widget: 'chart.bar',
        data: [
          { quarter: 'Q1', product: 80, service: 40 },
          { quarter: 'Q2', product: 100, service: 55 },
          { quarter: 'Q3', product: 90, service: 60 },
        ],
        mapping: { x: 'quarter', y: ['product', 'service'] },
        options: { stack: true },
      },
    },
    {
      label: 'Horizontal',
      spec: {
        widget: 'chart.bar',
        data: [
          { lang: 'JavaScript', pct: 65 },
          { lang: 'Python', pct: 48 },
          { lang: 'TypeScript', pct: 35 },
        ],
        options: { horizontal: true },
      },
    },
  ],
  'chart.line': [
    {
      label: 'Smooth multi-series',
      spec: {
        widget: 'chart.line',
        data: [
          { day: 'Mon', cpu: 45, mem: 62 },
          { day: 'Tue', cpu: 52, mem: 58 },
          { day: 'Wed', cpu: 68, mem: 71 },
        ],
        mapping: { x: 'day', y: ['cpu', 'mem'] },
        options: { smooth: true },
      },
    },
  ],
  'chart.area': [
    {
      label: 'Stacked area',
      spec: {
        widget: 'chart.area',
        data: [
          { month: 'Jan', organic: 100, paid: 60 },
          { month: 'Feb', organic: 120, paid: 80 },
          { month: 'Mar', organic: 110, paid: 90 },
        ],
        mapping: { x: 'month', y: ['organic', 'paid'] },
        options: { stack: true },
      },
    },
  ],
  'chart.pie': [
    {
      label: 'Donut + custom colors',
      spec: {
        widget: 'chart.pie',
        data: [
          { category: 'Completed', count: 42 },
          { category: 'In Progress', count: 18 },
          { category: 'Blocked', count: 5 },
        ],
        options: { donut: true, colors: ['#22c55e', '#f59e0b', '#ef4444'] },
      },
    },
  ],
  'chart.scatter': [
    {
      label: 'Color groups',
      spec: {
        widget: 'chart.scatter',
        data: [
          { height: 170, weight: 65, group: 'A' },
          { height: 175, weight: 72, group: 'A' },
          { height: 160, weight: 55, group: 'B' },
          { height: 180, weight: 80, group: 'B' },
        ],
        mapping: { x: 'height', y: 'weight', color: 'group' },
      },
    },
  ],
  'chart.radar': [
    {
      label: 'Multi-person comparison',
      spec: {
        widget: 'chart.radar',
        data: [
          { skill: 'JS', alice: 90, bob: 70 },
          { skill: 'CSS', alice: 80, bob: 85 },
          { skill: 'Node', alice: 75, bob: 60 },
        ],
        mapping: { axis: 'skill', y: ['alice', 'bob'] },
      },
    },
  ],
  'chart.heatmap': [
    {
      label: 'Custom colorRange',
      spec: {
        widget: 'chart.heatmap',
        data: [
          { x: 'Mon', y: '9am', value: 5 },
          { x: 'Mon', y: '12pm', value: 20 },
          { x: 'Tue', y: '9am', value: 8 },
          { x: 'Tue', y: '12pm', value: 25 },
        ],
        mapping: { x: 'x', y: 'y', value: 'value' },
        options: { colorRange: ['#eff6ff', '#3b82f6', '#1e3a5f'] },
      },
    },
  ],
  'chart.box': [
    {
      label: 'Multi-group',
      spec: {
        widget: 'chart.box',
        data: [
          { group: 'Setosa', min: 4.3, q1: 4.8, median: 5.0, q3: 5.2, max: 5.8 },
          { group: 'Versicolor', min: 4.9, q1: 5.6, median: 5.9, q3: 6.3, max: 7.0 },
        ],
      },
    },
  ],
  'chart.funnel': [
    {
      label: 'Marketing funnel',
      spec: {
        widget: 'chart.funnel',
        data: [
          { stage: 'Impressions', count: 10000 },
          { stage: 'Clicks', count: 3500 },
          { stage: 'Sign-ups', count: 800 },
          { stage: 'Purchases', count: 200 },
        ],
      },
    },
  ],
  'chart.waterfall': [
    {
      label: 'P&L waterfall',
      spec: {
        widget: 'chart.waterfall',
        data: [
          { item: 'Revenue', amount: 500 },
          { item: 'COGS', amount: -200 },
          { item: 'OpEx', amount: -120 },
          { item: 'Tax', amount: -50 },
        ],
      },
    },
  ],
  'chart.treemap': [
    {
      label: 'Nested hierarchy',
      spec: {
        widget: 'chart.treemap',
        data: [
          {
            name: 'Engineering', value: 100,
            children: [
              { name: 'Frontend', value: 40 },
              { name: 'Backend', value: 35 },
              { name: 'DevOps', value: 25 },
            ],
          },
          { name: 'Design', value: 50 },
        ],
      },
    },
  ],
  'metric': [
    {
      label: 'With prefix/suffix',
      spec: {
        widget: 'metric',
        data: { value: 4250, label: 'Revenue', prefix: '$', suffix: '/mo', change: 8.3, trend: 'up' },
      },
    },
  ],
  'stat-group': [
    {
      label: 'With all trends',
      spec: {
        widget: 'stat-group',
        data: [
          { value: 99.9, unit: '%', label: 'Uptime', change: 0.1, trend: 'up' },
          { value: 142, label: 'Requests/s', change: -5, trend: 'down' },
          { value: 3, label: 'Incidents', change: 0, trend: 'flat' },
        ],
      },
    },
  ],
  'gauge': [
    {
      label: 'Threshold colors',
      spec: {
        widget: 'gauge',
        data: { value: 73 },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [
            { to: 50, color: 'green' },
            { to: 80, color: 'yellow' },
            { to: 100, color: 'red' },
          ],
        },
      },
    },
  ],
  'progress': [
    {
      label: 'Label + thresholds',
      spec: {
        widget: 'progress',
        data: { value: 35, max: 100 },
        options: {
          label: '{percent}% complete',
          thresholds: [
            { to: 30, color: 'red' },
            { to: 60, color: 'yellow' },
            { to: 100, color: 'green' },
          ],
        },
      },
    },
  ],
  'table': [
    {
      label: 'Formatted columns',
      spec: {
        widget: 'table',
        data: [
          { name: 'Alice', role: 'Engineer', salary: 95000 },
          { name: 'Bob', role: 'Designer', salary: 82000 },
        ],
        mapping: {
          columns: [
            { field: 'name', label: 'Name' },
            { field: 'role', label: 'Role' },
            { field: 'salary', label: 'Salary', format: 'currency', align: 'right' },
          ],
        },
      },
    },
  ],
  'list': [
    {
      label: 'Avatar + trailing',
      spec: {
        widget: 'list',
        data: [
          { name: 'Alice Kim', role: 'Engineer', hours: '32h' },
          { name: 'Bob Park', role: 'Designer', hours: '28h' },
        ],
        mapping: { primary: 'name', secondary: 'role', trailing: 'hours' },
      },
    },
  ],
  'form': [
    {
      label: 'Validation + pattern',
      spec: {
        widget: 'form',
        fields: [
          { field: 'username', label: 'Username', type: 'text', required: true, minLength: 3, maxLength: 20 },
          { field: 'email', label: 'Email', type: 'email', required: true },
          { field: 'plan', label: 'Plan', type: 'radio', options: ['Free', 'Pro', 'Enterprise'] },
        ],
        actions: [
          { label: 'Register', action: 'submit', style: 'primary' },
        ],
      },
    },
  ],
  'confirm': [
    {
      label: 'Danger action',
      spec: {
        widget: 'confirm',
        title: 'Delete Project',
        description: 'This action cannot be undone.',
        actions: [
          { label: 'Cancel', action: 'cancel' },
          { label: 'Delete', action: 'submit', style: 'danger' },
        ],
      },
    },
  ],
  'markdown': [
    {
      label: 'Rich content',
      spec: {
        widget: 'markdown',
        data: { content: '# Getting Started\n\nWelcome to **u-widgets**!\n\n- Metrics & gauges\n- Charts with minimal JSON\n\n```json\n{ "widget": "metric", "data": { "value": 42 } }\n```' },
      },
    },
  ],
  'image': [
    {
      label: 'With caption',
      spec: {
        widget: 'image',
        data: { src: 'https://placehold.co/400x200', alt: 'Banner', caption: 'Declarative widget system' },
      },
    },
  ],
  'callout': [
    {
      label: 'Info with title',
      spec: {
        widget: 'callout',
        data: { title: 'Did you know?', message: 'u-widgets auto-infers mappings from data shape.', level: 'info' },
      },
    },
  ],
  'code': [
    {
      label: 'Python with line highlights',
      spec: {
        widget: 'code',
        data: {
          content: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))',
          language: 'python',
        },
        options: { highlight: [2, 3] },
      },
    },
    {
      label: 'SQL query',
      spec: {
        widget: 'code',
        data: {
          content: 'SELECT u.name, COUNT(o.id) AS orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = TRUE\nGROUP BY u.name\nORDER BY orders DESC\nLIMIT 10;',
          language: 'sql',
        },
      },
    },
  ],
  'citation': [
    {
      label: 'Multiple sources with snippets',
      spec: {
        widget: 'citation',
        data: [
          { title: 'Web Components MDN', url: 'https://developer.mozilla.org/docs/Web/API/Web_components', snippet: 'Create reusable custom elements.', source: 'MDN' },
          { title: 'Lit Documentation', url: 'https://lit.dev/docs/', snippet: 'Fast, lightweight web components.', source: 'lit.dev' },
        ],
      },
    },
    {
      label: 'Compact mode',
      spec: {
        widget: 'citation',
        data: [
          { title: 'Source A', url: 'https://example.com/a' },
          { title: 'Source B', url: 'https://example.com/b' },
        ],
        options: { compact: true },
      },
    },
  ],
  'status': [
    {
      label: 'System health dashboard',
      spec: {
        widget: 'status',
        title: 'System Status',
        data: [
          { label: 'API Gateway', value: 'Operational', level: 'success' },
          { label: 'Database', value: 'Degraded', level: 'warning' },
          { label: 'CDN', value: 'Operational', level: 'success' },
          { label: 'Auth Service', value: 'Down', level: 'error' },
          { label: 'Backup', value: 'Scheduled', level: 'info' },
        ],
      },
    },
  ],
  'steps': [
    {
      label: 'With descriptions',
      spec: {
        widget: 'steps',
        data: [
          { label: 'Collecting data', status: 'done', description: '2M records processed' },
          { label: 'Running analysis', status: 'active', description: 'Estimated 30s remaining' },
          { label: 'Generating report', status: 'pending' },
        ],
      },
    },
    {
      label: 'Horizontal layout',
      spec: {
        widget: 'steps',
        data: [
          { label: 'Upload', status: 'done' },
          { label: 'Process', status: 'active' },
          { label: 'Review', status: 'pending' },
          { label: 'Deploy', status: 'pending' },
        ],
        options: { layout: 'horizontal' },
      },
    },
  ],
  'rating': [
    {
      label: 'Heart icon',
      spec: {
        widget: 'rating',
        data: { value: 3, max: 5 },
        options: { icon: 'heart' },
      },
    },
    {
      label: 'Interactive star',
      spec: {
        widget: 'rating',
        options: { interactive: true, label: 'Rate this answer:' },
      },
    },
  ],
  'video': [
    {
      label: 'Autoplay muted loop',
      spec: {
        widget: 'video',
        data: { src: 'https://example.com/bg.mp4', caption: 'Background video' },
        options: { autoplay: true, loop: true, muted: true },
      },
    },
  ],
  'gallery': [
    {
      label: 'Square grid with captions',
      spec: {
        widget: 'gallery',
        data: [
          { src: 'https://placehold.co/200', alt: 'A', caption: 'Product A' },
          { src: 'https://placehold.co/200', alt: 'B', caption: 'Product B' },
          { src: 'https://placehold.co/200', alt: 'C', caption: 'Product C' },
          { src: 'https://placehold.co/200', alt: 'D', caption: 'Product D' },
        ],
        options: { columns: 2, aspectRatio: '1:1' },
      },
    },
  ],
  'kv': [
    {
      label: 'Array form (ordered)',
      spec: {
        widget: 'kv',
        data: [
          { key: 'Name', value: 'Alice Kim' },
          { key: 'Email', value: 'alice@example.com' },
          { key: 'Role', value: 'Engineer' },
        ],
      },
    },
    {
      label: 'Horizontal layout',
      spec: {
        widget: 'kv',
        data: { CPU: '72%', Memory: '4.2 GB', Disk: '85%' },
        options: { layout: 'horizontal' },
      },
    },
  ],
  'actions': [
    {
      label: 'Quick replies',
      spec: {
        widget: 'actions',
        actions: [
          { label: 'Revenue analysis', action: 'analyze_revenue' },
          { label: 'Customer status', action: 'customer_status' },
          { label: 'Inventory check', action: 'check_inventory' },
        ],
      },
    },
  ],
  'divider': [
    {
      label: 'With label',
      spec: {
        widget: 'divider',
        options: { label: 'Related items' },
      },
    },
  ],
  'header': [
    {
      label: 'Level 1 heading',
      spec: {
        widget: 'header',
        data: { text: 'Dashboard', level: 1 },
      },
    },
  ],
  'compose': [
    {
      label: 'Grid dashboard',
      spec: {
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        children: [
          { widget: 'metric', data: { value: 99.9, unit: '%', label: 'Uptime' } },
          { widget: 'metric', data: { value: 142, label: 'Requests/s' } },
          { widget: 'progress', data: { value: 680, max: 1000 }, options: { label: '{value} / 1000' }, span: 2 },
        ],
      },
    },
    {
      label: 'Column widths (sidebar + main)',
      spec: {
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        options: { widths: [1, 3] },
        children: [
          { widget: 'kv', data: { plan: 'Pro', status: 'Active' } },
          { widget: 'table', data: [{ name: 'Alice', role: 'Dev' }, { name: 'Bob', role: 'PM' }] },
        ],
      },
    },
    {
      label: 'Collapsed section',
      spec: {
        widget: 'compose',
        children: [
          { widget: 'kv', data: { summary: 'All systems operational' } },
          { widget: 'table', title: 'Detailed logs', collapsed: true, data: [{ time: '10:00', event: 'Deploy' }] },
        ],
      },
    },
  ],
};

/** Build a full WidgetDetail from a WidgetInfo catalog entry. */
function buildWidgetDetail(info: WidgetInfo): WidgetDetail {
  const w = info.widget;

  // Mapping docs
  const mappingDocs: Record<string, string> = {};
  for (const key of info.mappingKeys) {
    if (MAPPING_DOCS[key]) mappingDocs[key] = MAPPING_DOCS[key];
  }

  // Option docs
  const optionDocs: Record<string, string> = {};
  for (const key of (WIDGET_OPTIONS[w] ?? [])) {
    if (OPTION_DOCS[key]) optionDocs[key] = OPTION_DOCS[key];
  }

  // Form/confirm-specific docs
  const isInput = w === 'form' || w === 'confirm';

  // Examples: template as "Minimal" + feature-rich
  const examples: { label: string; spec: UWidgetSpec }[] = [];
  const tmpl = TEMPLATES[w];
  if (tmpl) {
    examples.push({ label: 'Minimal', spec: JSON.parse(JSON.stringify(tmpl)) });
  }
  const extra = EXAMPLES[w];
  if (extra) {
    for (const e of extra) {
      examples.push({ label: e.label, spec: JSON.parse(JSON.stringify(e.spec)) });
    }
  }

  return {
    ...info,
    autoInference: WIDGET_INFERENCE[w] ?? '',
    dataFields: [...(WIDGET_DATA_FIELDS[w] ?? [])],
    mappingDocs,
    optionDocs,
    ...(isInput ? { fieldDocs: { ...FIELD_PROP_DOCS } } : {}),
    ...(isInput ? { actionDocs: { ...ACTION_PROP_DOCS } } : {}),
    events: getWidgetEvents(w),
    examples,
  };
}

/**
 * Generate a minimal template spec for a widget type.
 *
 * Returns a complete, valid spec with sample data that can be
 * used as a starting point. Returns `undefined` for unknown types.
 *
 * @param widget - Widget type identifier (e.g., `"chart.bar"`, `"metric"`).
 * @returns A deep-copied template spec, or `undefined`.
 *
 * @example
 * ```ts
 * template('metric')
 * // → { widget: 'metric', data: { value: 1284, unit: 'users', ... } }
 * ```
 */
export function template(widget: string): UWidgetSpec | undefined {
  const t = TEMPLATES[widget];
  if (!t) return undefined;
  return JSON.parse(JSON.stringify(t));
}
