/**
 * Widget catalog and template generation for programmatic use.
 *
 * Designed to power an MCP server or any tool that needs
 * to list widgets, describe their capabilities, or generate
 * minimal starter specs.
 */

import type { UWidgetSpec } from './types.js';

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
  /** Data fields description (what keys to include in `data`). */
  dataFields?: string;
  /** Supported `options` keys with descriptions. */
  optionsDocs?: string;
}

const CATALOG: readonly WidgetInfo[] = [
  // Charts
  { widget: 'chart.bar', category: 'chart', description: 'Bar chart for category × value comparison', mappingKeys: ['x', 'y'], dataShape: 'array',
    optionsDocs: 'stacked (boolean), horizontal (boolean)' },
  { widget: 'chart.line', category: 'chart', description: 'Line chart for trends over a category axis', mappingKeys: ['x', 'y'], dataShape: 'array',
    optionsDocs: 'smooth (boolean), stacked (boolean)' },
  { widget: 'chart.area', category: 'chart', description: 'Area chart (filled line chart)', mappingKeys: ['x', 'y'], dataShape: 'array',
    optionsDocs: 'smooth (boolean), stacked (boolean)' },
  { widget: 'chart.pie', category: 'chart', description: 'Pie or donut chart for proportions', mappingKeys: ['label', 'value'], dataShape: 'array',
    optionsDocs: 'donut (boolean)' },
  { widget: 'chart.scatter', category: 'chart', description: 'Scatter plot for two numeric dimensions', mappingKeys: ['x', 'y', 'color', 'size'], dataShape: 'array' },
  { widget: 'chart.radar', category: 'chart', description: 'Radar chart for multi-axis comparison', mappingKeys: ['axis', 'value'], dataShape: 'array',
    dataFields: 'axis (string): indicator label; value fields (number): one per series' },
  { widget: 'chart.heatmap', category: 'chart', description: 'Heatmap for matrix data visualization', mappingKeys: ['x', 'y', 'value'], dataShape: 'array',
    dataFields: 'x (string): column category; y (string): row category; value (number): cell intensity' },
  { widget: 'chart.box', category: 'chart', description: 'Box plot for statistical distribution', mappingKeys: ['x', 'y'], dataShape: 'array',
    dataFields: 'x (string): group name; min, q1, median, q3, max (number): five-number summary' },
  { widget: 'chart.funnel', category: 'chart', description: 'Funnel chart for sequential stages', mappingKeys: ['label', 'value'], dataShape: 'array' },
  { widget: 'chart.waterfall', category: 'chart', description: 'Waterfall chart for cumulative values', mappingKeys: ['x', 'y'], dataShape: 'array' },
  { widget: 'chart.treemap', category: 'chart', description: 'Treemap for hierarchical data', mappingKeys: [], dataShape: 'array',
    dataFields: 'name (string): node label; value (number): node size; children (array, optional): nested nodes' },
  // Display
  { widget: 'metric', category: 'display', description: 'Single KPI value with optional trend', mappingKeys: [], dataShape: 'object',
    dataFields: 'value (number): the KPI number; unit (string?): display unit; change (number?): delta; trend ("up"|"down"?)' },
  { widget: 'stat-group', category: 'display', description: 'Multiple KPI values in a row', mappingKeys: [], dataShape: 'array',
    dataFields: 'label (string): stat name; value (number): stat value; suffix (string?): unit suffix' },
  { widget: 'gauge', category: 'display', description: 'Arc gauge for a value within a range', mappingKeys: [], dataShape: 'object',
    dataFields: 'value (number): current value',
    optionsDocs: 'min (number), max (number), unit (string), thresholds (array of {value,color})' },
  { widget: 'progress', category: 'display', description: 'Progress bar for a value within a range', mappingKeys: [], dataShape: 'object',
    dataFields: 'value (number): current value',
    optionsDocs: 'min (number), max (number), unit (string)' },
  { widget: 'table', category: 'display', description: 'Sortable data table with auto-inferred columns', mappingKeys: ['columns'], dataShape: 'array',
    optionsDocs: 'pageSize (number), compact (boolean), locale (string)' },
  { widget: 'list', category: 'display', description: 'Structured list with avatars and trailing values', mappingKeys: ['primary', 'secondary', 'avatar', 'icon', 'trailing'], dataShape: 'array',
    optionsDocs: 'compact (boolean)' },
  // Input
  { widget: 'form', category: 'input', description: 'Data entry form with typed fields', mappingKeys: [], dataShape: 'object',
    dataFields: 'data provides default values for fields',
    optionsDocs: 'locale (string): validation message language' },
  { widget: 'confirm', category: 'input', description: 'Yes/no confirmation dialog', mappingKeys: [], dataShape: 'object' },
  // Content
  { widget: 'markdown', category: 'content', description: 'Render markdown text (headers, bold, italic, code, links, lists, tables)', mappingKeys: [], dataShape: 'object',
    dataFields: 'content (string): markdown text, or pass string directly as data' },
  { widget: 'image', category: 'content', description: 'Display an image', mappingKeys: [], dataShape: 'object',
    dataFields: 'src (string): image URL; alt (string): alt text; caption (string?): caption text' },
  { widget: 'callout', category: 'content', description: 'Callout/alert banner', mappingKeys: [], dataShape: 'object',
    dataFields: 'message (string): body text; level ("info"|"warning"|"error"|"success"); title (string?): optional heading' },
  // Composition
  { widget: 'compose', category: 'composition', description: 'Combine multiple widgets with layout hints', mappingKeys: [], dataShape: 'none',
    optionsDocs: 'layout ("stack"|"row"|"grid"), columns (number, for grid), children (array of widget specs)' },
];

/**
 * Get the widget catalog.
 *
 * @param widget - Optional widget type to filter. Returns all widgets if omitted.
 * @returns Array of widget info objects, or a single item if a specific widget is requested.
 *
 * @example
 * ```ts
 * help()              // → all widget descriptions
 * help('chart')       // → all chart types
 * help('chart.bar')   // → [{ widget: 'chart.bar', ... }]
 * ```
 */
export function help(widget?: string): WidgetInfo[] {
  if (!widget) return [...CATALOG];

  // Exact match
  const exact = CATALOG.filter((w) => w.widget === widget);
  if (exact.length > 0) return exact;

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
    data: { src: 'https://via.placeholder.com/300x200', alt: 'Placeholder image' },
  },
  'callout': {
    widget: 'callout',
    data: { content: 'This is an informational callout.', variant: 'info' },
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
