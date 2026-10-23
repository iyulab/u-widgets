/**
 * Static description registries extracted from JSON Schema definitions.
 *
 * These registries are the single source of truth for property descriptions
 * shared between the MCP server `help()` output and the demo props panel.
 * Safety tests enforce that every key in the JSON Schema has a corresponding
 * entry here — adding a schema key without a description causes a test failure.
 */

import { dataFieldLabel, optionLabel } from './tool-labels.js';
import { FRAMES } from './frame.js';

/** Mapping key descriptions (from schema $defs/mapping.properties). */
export const MAPPING_DOCS: Readonly<Record<string, string>> = {
  x: 'X-axis / category field',
  y: 'Y-axis value field(s)',
  label: 'Label field (pie/funnel/gantt)',
  value: 'Value field (pie/funnel/heatmap/histogram)',
  color: 'Color grouping field (scatter/gantt)',
  size: 'Size encoding field (scatter bubble)',
  opacity: 'Opacity encoding field (scatter bubble)',
  axis: 'Axis field (radar indicators)',
  total: 'Total-flag field — truthy rows draw as absolute totals (waterfall)',
  start: 'Interval start field — number or date-like (gantt)',
  end: 'Interval end field — number or date-like (gantt)',
  columns: 'Column definitions (table); in a list, values shown after the text, each formatted',
  primary: 'Primary text field (list)',
  secondary: 'Secondary text field (list)',
  icon: 'Icon letter field (list)',
  avatar: 'Avatar image URL field (list)',
  trailing: 'Trailing value field (list)',
  badge: 'Badge/tag field (list)',
  time: 'Time field shown first in each row — a date-time shows its time of day (list)',
  tone: 'Field holding each row\'s tone: its mark and colour, past dims, now picks out (list)',
};

/** Field definition property descriptions (from schema $defs/fieldDefinition). */
export const FIELD_PROP_DOCS: Readonly<Record<string, string>> = {
  field: 'Key name in submitted data',
  label: 'Display label',
  type: 'Input type',
  required: 'Must be filled before submit',
  placeholder: 'Placeholder text',
  options: 'Choices for select/multiselect/radio/checkbox — string, or { value, label } to submit a value other than the text shown',
  minLength: 'Minimum character length',
  maxLength: 'Maximum character length',
  pattern: 'Custom regex pattern',
  rows: 'Textarea visible rows',
  min: 'Minimum value',
  max: 'Maximum value',
  step: 'Number/range step increment',
  message: 'Custom validation error message',
};

/**
 * Well-known data field descriptions.
 * Unlike schema-bound registries, these cover common keys used across widgets.
 * Not enforced by schema tests — new keys appear with type only until added here.
 */
export const DATA_FIELD_DOCS: Readonly<Record<string, string>> = {
  // metric / stat-group
  value: 'The primary value to display',
  label: 'Display label or category name',
  unit: 'Value unit suffix',
  prefix: 'Text before the value',
  suffix: 'Text after the value',
  change: 'Delta / change amount',
  trend: 'Trend direction (up, down, flat)',
  // content
  content: 'Body text or markdown content',
  message: 'Message body text',
  tone: 'State tone (ok, info, watch, warn, alarm, off, idle, accent, past, now, next)',
  title: 'Heading or title text',
  src: 'Source URL (image)',
  alt: 'Alt text (image)',
  caption: 'Caption text',
  // progress
  max: 'Maximum bound value',
  // treemap / general
  name: 'Node or item name',
  children: 'Nested child nodes',
  // kv / header
  language: 'Programming language identifier',
  key: 'Key or label identifier',
  text: 'Display text content',
  // steps
  status: 'Step status (done, active, pending, error)',
  description: 'Detailed description text',
  // rating
  count: 'Number of reviews or votes',
  // video / citation
  poster: 'Video poster image URL',
  url: 'Link URL',
  snippet: 'Excerpt or summary text',
  source: 'Source name or publisher',
  // math
  expression: 'LaTeX math expression string',
  // chart data
  group: 'Group / category identifier',
  min: 'Minimum stat value',
  q1: 'First quartile (25th percentile)',
  median: 'Median (50th percentile)',
  q3: 'Third quartile (75th percentile)',
};

/**
 * Well-known options descriptions.
 * Covers widget-specific rendering options used across the catalog.
 */
export const OPTION_DOCS: Readonly<Record<string, string>> = {
  // gauge / progress
  min: 'Minimum range value',
  max: 'Maximum range value',
  unit: 'Display unit string',
  thresholds: 'Colour steps: up to each `to`, a colour or a tone (and a label)',
  band: 'The acceptable band of the scale ({ lo, hi }), drawn beside it',
  marks: 'Labelled lines on the scale ([{ at, label? }]) — a set level, a limit',
  label: 'Label template ({value}, {percent})',
  format: "Value format hint — 'number', 'number:2' (fixed decimals), 'percent', 'currency:EUR' … in the widget's locale (gauge/progress default: number)",
  // chart
  smooth: 'Smooth curves (line/area)',
  stack: 'Stack series (bar/line/area)',
  horizontal: 'Horizontal orientation (bar)',
  donut: 'Donut style (pie)',
  colors: 'Custom color palette',
  colorRange: 'Heatmap color gradient',
  echarts: 'Raw ECharts option, deep-merged onto the generated one — what the other options do not say',
  histogram: 'Histogram mode (bar)',
  bins: 'Number of histogram bins (auto: Sturges rule)',
  referenceLines: 'Reference/threshold lines',
  categories: 'Row order top to bottom; listed rows show even without intervals (gantt)',
  series: "Per-series overrides in mapping.y order [{label?, color?, lineStyle?: 'solid'|'dashed'|'dotted'|{ECharts lineStyle}, symbol?, type?, yAxisIndex?}]",
  conditionalStyles: 'Per-point conditional styling rules [{field, above?, below?, color, symbol?, symbolSize?}]',
  subtitle: 'Static subtitle text (gauge)',
  step: 'Step interpolation (line)',
  legend: 'Show/hide legend',
  grid: 'Show/hide grid lines',
  animate: 'Enable/disable animation',
  showLabel: 'Show/hide data labels',
  xFormat: 'X-axis label format {type?, prefix?, suffix?, currency?, decimals?}',
  yFormat: 'Y-axis label format {type?, prefix?, suffix?, currency?, decimals?}',
  valueAxisZero: 'Value axis reaches zero (default); false spans the data — for values far from zero (bar/line/area)',
  xAxisType: "'value' — points at their numeric x (uneven times or distances), not evenly spaced categories (line/area)",
  // table / list
  pageSize: 'Rows per page',
  compact: 'Compact display mode',
  searchable: 'Enable search filter',
  locale: 'Locale for formatting/validation',
  // code
  lineNumbers: 'Show/hide line numbers (default true)',
  highlight: 'Line numbers to highlight (array)',
  maxHeight: 'Maximum height with scroll (e.g. "300px")',
  wrap: 'Word wrap long lines (default false)',
  // citation
  numbered: 'Show numbered badges (default true)',
  // rating
  interactive: 'Allow user input (default false)',
  sortable: 'Sort by a column when its header is clicked (default true)',
  icon: 'Icon type (star, heart, thumb)',
  // video
  autoplay: 'Auto-play on load (default false)',
  controls: 'Show playback controls (default true)',
  loop: 'Loop playback (default false)',
  muted: 'Start muted (default false, auto when autoplay)',
  // gallery
  aspectRatio: 'Image aspect ratio (e.g. "1:1", "16:9", default auto)',
  // math
  displayMode: 'Block mode with centered large formula (default false = inline)',
  // compose / kv / actions / divider / steps
  layout: 'Layout mode (stack, row, grid, horizontal, vertical, wrap, column)',
  columns: 'Number of grid columns',
  widths: 'Column width ratios (number[], "auto", "stretch")',
  spacing: 'Spacing size (small, default, large)',
  cell: 'Cell shape: square (label inside), chip (a wider pill) or dot (the tone alone)',
  counts: 'Add a key: how many cells are in each tone',
  form: 'How each value is drawn: bar (default) or pictogram (a row of glyphs)',
  glyph: 'The glyph a pictogram repeats (default ●)',
  glyphValue: 'How much one glyph stands for (default 1)',
  maxItems: 'Show at most this many rows, then a line saying how many more',
  overflow: 'What a box too small does with the rest: clip (default), fade or scroll',
  frame: 'Draw inside a frame: card, flat, glow, plate, ticket, postage or tape (compose: each child)',
};

/**
 * What an option's value is.
 *
 * `type` uses the notation of `DataFieldInfo.type`. `enum` lists a choice's values and `default` is what
 * the widget uses when the option is left out — present only where the widget's code fixes one.
 */
export interface OptionTypeInfo {
  readonly type: string;
  readonly enum?: readonly string[];
  readonly default?: unknown;
}

const choice = (values: readonly string[], defaultValue?: string): OptionTypeInfo => ({
  type: values.map(v => `"${v}"`).join(' | '),
  enum: values,
  ...(defaultValue !== undefined && { default: defaultValue }),
});

/** Value types of the options in OPTION_DOCS, as most widgets read them. */
export const OPTION_TYPES: Readonly<Record<string, OptionTypeInfo>> = {
  min: { type: 'number' },
  max: { type: 'number' },
  unit: { type: 'string' },
  thresholds: { type: '{ to: number, color?: string, tone?: string, label?: string }[]' },
  band: { type: 'object' },
  marks: { type: '{ at: number, label?: string }[]' },
  label: { type: 'string' },
  smooth: { type: 'boolean', default: false },
  stack: { type: 'boolean', default: false },
  horizontal: { type: 'boolean', default: false },
  donut: { type: 'boolean', default: false },
  colors: { type: 'string[]' },
  colorRange: { type: 'string[]' },
  echarts: { type: 'object' },
  histogram: { type: 'boolean', default: false },
  bins: { type: 'number' },
  referenceLines: { type: 'object[]' },
  categories: { type: 'string[]' },
  series: { type: 'object[]' },
  conditionalStyles: { type: 'object[]' },
  subtitle: { type: 'string' },
  format: { type: 'string' },
  step: { type: 'boolean | "start" | "middle" | "end"' },
  legend: { type: 'boolean', default: true },
  grid: { type: 'boolean', default: true },
  animate: { type: 'boolean', default: true },
  showLabel: { type: 'boolean' },
  xFormat: { type: 'object' },
  yFormat: { type: 'object' },
  valueAxisZero: { type: 'boolean', default: true },
  xAxisType: { type: '"category" | "value"', default: 'category' },
  pageSize: { type: 'number' },
  compact: { type: 'boolean', default: false },
  searchable: { type: 'boolean', default: false },
  locale: { type: 'string' },
  lineNumbers: { type: 'boolean', default: true },
  highlight: { type: 'number[]' },
  maxHeight: { type: 'string' },
  wrap: { type: 'boolean', default: false },
  numbered: { type: 'boolean', default: true },
  interactive: { type: 'boolean', default: false },
  sortable: { type: 'boolean', default: true },
  icon: choice(['star', 'heart', 'thumb'], 'star'),
  autoplay: { type: 'boolean', default: false },
  controls: { type: 'boolean', default: true },
  loop: { type: 'boolean', default: false },
  muted: { type: 'boolean', default: false },
  aspectRatio: { type: 'string', default: 'auto' },
  displayMode: { type: 'boolean', default: false },
  layout: { type: 'string' },
  columns: { type: 'number' },
  widths: { type: '(number | "auto" | "stretch")[]' },
  spacing: choice(['small', 'default', 'large'], 'default'),
  frame: choice(FRAMES),
  overflow: choice(['clip', 'fade', 'scroll'], 'clip'),
  maxItems: { type: 'number' },
  cell: choice(['square', 'chip', 'dot'], 'square'),
  counts: { type: 'boolean', default: false },
  form: choice(['bar', 'pictogram'], 'bar'),
  glyph: { type: 'string' },
  glyphValue: { type: 'number', default: 1 },
};

/** Where an option's type, choices, default or meaning differ for one widget. */
const WIDGET_OPTION_OVERRIDES: Readonly<Record<string, Readonly<Record<string, Partial<OptionTypeInfo> & { desc?: string }>>>> = {
  gauge: { min: { default: 0 }, max: { default: 100 }, form: { ...choice(['arc', 'vertical', 'tank', 'thermometer'], 'arc'), desc: 'How the reading is drawn: an arc (default), or a level rising in a column, a tank or a thermometer' } },
  progress: { min: { default: 0 }, max: { default: 100 } },
  table: {
    interactive: { default: true, desc: 'Search, sorting, pages and picking a row — false for a table only to be looked at (a wall, a board)' },
    maxItems: { desc: 'Show at most this many rows (when not paged), then a line saying how many more' },
  },
  'bar-list': { max: { desc: 'The scale the bars share (default: the largest value)' } },
  rating: { max: { default: 5, desc: 'Number of icons' }, label: { desc: 'Label text' } },
  kv: { layout: choice(['vertical', 'horizontal', 'grid'], 'vertical'), columns: { default: 2, desc: 'Number of grid columns (grid layout)' } },
  steps: { layout: choice(['vertical', 'horizontal'], 'vertical') },
  list: { layout: choice(['list', 'tiles'], 'list') },
  actions: { layout: choice(['wrap', 'column'], 'wrap') },
  divider: { label: { desc: 'Text on the line' } },
};

/** An option a widget reads: its key, short name, description and value type. */
export interface OptionInfo extends OptionTypeInfo {
  readonly key: string;
  /** A short name for a form label ("Minimum") — in the requested locale (see `getToolLabels`). */
  readonly label: string;
  readonly desc: string;
}

/**
 * The options `widget` reads, each with its name in `locale` (resolved as a widget's locale is), its
 * description and its value type (`OPTION_TYPES`, adjusted for the widget).
 */
export function getWidgetOptions(widget: string, locale?: string): OptionInfo[] {
  const keys = WIDGET_OPTIONS[widget] ?? [];
  return keys.map(key => {
    const { desc, ...override } = WIDGET_OPTION_OVERRIDES[widget]?.[key] ?? {};
    return { key, label: optionLabel(widget, key, locale), desc: desc ?? OPTION_DOCS[key] ?? '', ...OPTION_TYPES[key], ...override };
  });
}

/** Action property descriptions (from schema $defs/action). */
export const ACTION_PROP_DOCS: Readonly<Record<string, string>> = {
  label: 'Button text',
  action: 'Action identifier (submit, cancel, navigate, custom)',
  style: 'Visual style (primary, danger, default)',
  disabled: 'Whether disabled',
  url: 'URL for navigate action',
};

// ── Per-Widget Registries ──

/** Data field descriptor for well-known widget data properties. */
export interface DataFieldInfo {
  readonly key: string;
  /** A short name for a form label ("Value") — English in `WIDGET_DATA_FIELDS`, localized by `getWidgetDataFields`. */
  readonly label: string;
  readonly type: string;
  readonly desc: string;
  readonly required?: boolean;
  /** The values of a field whose `type` is a union of string literals (`"up" | "down" | "flat"`). */
  readonly enum?: readonly string[];
}

/** `"a" | "b"` → `['a', 'b']`; anything that is not purely string literals → `undefined`. */
function literalUnion(type: string): string[] | undefined {
  const parts = type.split('|').map(part => part.trim());
  const values = parts.map(part => /^"([^"]*)"$/.exec(part)?.[1]);
  return values.every(v => v !== undefined) ? (values as string[]) : undefined;
}

/** Fills in each field's English name and, for a union of string literals, its `enum`. */
function withNamesAndEnums(fields: Record<string, readonly Omit<DataFieldInfo, 'label' | 'enum'>[]>): Record<string, readonly DataFieldInfo[]> {
  return Object.fromEntries(
    Object.entries(fields).map(([widget, list]) => [
      widget,
      list.map(field => {
        const values = literalUnion(field.type);
        return { ...field, label: dataFieldLabel(widget, field.key, 'en'), ...(values && { enum: values }) };
      }),
    ]),
  );
}

/** Relevant option keys per widget type. Only lists keys from OPTION_DOCS. */
export const WIDGET_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  'chart.bar': ['stack', 'horizontal', 'histogram', 'colors', 'series', 'referenceLines', 'conditionalStyles', 'xFormat', 'yFormat', 'valueAxisZero', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'chart.line': ['smooth', 'stack', 'step', 'colors', 'series', 'referenceLines', 'conditionalStyles', 'xFormat', 'yFormat', 'valueAxisZero', 'xAxisType', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'chart.area': ['smooth', 'stack', 'colors', 'series', 'referenceLines', 'conditionalStyles', 'xFormat', 'yFormat', 'valueAxisZero', 'xAxisType', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'chart.pie': ['donut', 'colors', 'legend', 'animate', 'showLabel', 'echarts'],
  'chart.scatter': ['colors', 'referenceLines', 'conditionalStyles', 'xFormat', 'yFormat', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'chart.radar': ['colors', 'legend', 'animate', 'showLabel', 'echarts'],
  'chart.heatmap': ['colorRange', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'chart.box': ['colors', 'legend', 'grid', 'animate', 'echarts'],
  'chart.funnel': ['colors', 'legend', 'animate', 'showLabel', 'echarts'],
  'chart.waterfall': ['colors', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'chart.treemap': ['colors', 'animate', 'showLabel', 'echarts'],
  'chart.histogram': ['bins', 'colors', 'referenceLines', 'xFormat', 'yFormat', 'legend', 'grid', 'animate', 'echarts'],
  'chart.gantt': ['categories', 'colors', 'referenceLines', 'xFormat', 'legend', 'grid', 'animate', 'showLabel', 'echarts'],
  'metric': ['format'],
  'stat-group': ['format'],
  'gauge': ['min', 'max', 'unit', 'thresholds', 'label', 'subtitle', 'format', 'form', 'band', 'marks'],
  'progress': ['min', 'max', 'unit', 'thresholds', 'label', 'format'],
  'bar-list': ['max', 'form', 'glyph', 'glyphValue', 'maxItems'],
  'table': ['pageSize', 'compact', 'searchable', 'sortable', 'interactive', 'maxItems'],
  'list': ['compact', 'layout', 'maxItems'],
  'form': ['locale'],
  'confirm': [],
  'markdown': [],
  'image': [],
  'callout': [],
  // `layout` and `columns` are top-level spec fields of compose, not options.
  'compose': ['widths', 'frame'],
  'kv': ['layout', 'columns'],
  'code': ['lineNumbers', 'highlight', 'maxHeight', 'wrap'],
  'citation': ['compact', 'numbered'],
  'status': [],
  'status-card': ['overflow'],
  'status-grid': ['columns', 'cell', 'counts'],
  'steps': ['layout', 'compact'],
  'rating': ['max', 'interactive', 'icon', 'label'],
  'video': ['autoplay', 'controls', 'loop', 'muted'],
  'gallery': ['columns', 'aspectRatio'],
  'math': ['displayMode'],
  'actions': ['layout'],
  'divider': ['label', 'spacing'],
  'header': [],
};

/**
 * Well-known data fields per widget type.
 * Charts/table/list use user-defined fields so they are omitted.
 */
export const WIDGET_DATA_FIELDS: Readonly<Record<string, readonly DataFieldInfo[]>> = withNamesAndEnums({
  'metric': [
    { key: 'value', type: 'number | string', desc: 'Primary value', required: true },
    { key: 'label', type: 'string', desc: 'Display label' },
    { key: 'unit', type: 'string', desc: 'Value unit suffix' },
    { key: 'prefix', type: 'string', desc: 'Text before value' },
    { key: 'suffix', type: 'string', desc: 'Text after value' },
    { key: 'change', type: 'number', desc: 'Delta amount' },
    { key: 'trend', type: '"up" | "down" | "flat"', desc: 'Trend direction' },
    { key: 'icon', type: 'string', desc: 'Emoji or short text icon' },
    { key: 'note', type: 'string', desc: 'A line under the value' },
    { key: 'meter', type: '{ value, min?, max?, unit?, format?, tone?, form? }', desc: 'A value against its range, as a bar or a ring (form: "ring"; min 0, max 100 unless given)' },
    { key: 'sparkline', type: 'number[]', desc: 'Recent values, oldest first, drawn as a small line under the value' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'State tone of the value' },
    { key: 'emphasis', type: '"invert" | "hatch" | "stamp" | "blink"', desc: 'A second channel besides colour' },
  ],
  'stat-group': [
    { key: 'label', type: 'string', desc: 'Display label', required: true },
    { key: 'value', type: 'number', desc: 'Primary value', required: true },
    { key: 'unit', type: 'string', desc: 'Value unit suffix' },
    { key: 'prefix', type: 'string', desc: 'Text before value' },
    { key: 'suffix', type: 'string', desc: 'Text after value' },
    { key: 'change', type: 'number', desc: 'Delta amount' },
    { key: 'trend', type: '"up" | "down" | "flat"', desc: 'Trend direction' },
    { key: 'icon', type: 'string', desc: 'Emoji or short text icon' },
    { key: 'note', type: 'string', desc: 'A line under the value' },
    { key: 'meter', type: '{ value, min?, max?, unit?, format?, tone?, form? }', desc: 'A value against its range, as a bar or a ring (form: "ring"; min 0, max 100 unless given)' },
    { key: 'sparkline', type: 'number[]', desc: 'Recent values, oldest first, drawn as a small line under the value' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'State tone of the value' },
    { key: 'emphasis', type: '"invert" | "hatch" | "stamp" | "blink"', desc: 'A second channel besides colour' },
  ],
  'gauge': [
    { key: 'value', type: 'number', desc: 'The reading', required: true },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'Its state, decided elsewhere — its colour, over the thresholds' },
  ],
  'progress': [
    { key: 'value', type: 'number', desc: 'Current value', required: true },
    { key: 'max', type: 'number', desc: 'Maximum bound (default 100)' },
  ],
  'bar-list': [
    { key: 'label', type: 'string', desc: 'The item', required: true },
    { key: 'value', type: 'number', desc: 'Its amount — the bar’s length', required: true },
    { key: 'max', type: 'number', desc: 'Its own scale (default: the list’s)' },
    { key: 'unit', type: 'string', desc: 'The value’s unit' },
    { key: 'format', type: 'string', desc: 'The value’s format (number:1, percent, …)' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'Its state: the bar’s colour' },
    { key: 'note', type: 'string', desc: 'A line under the bar' },
  ],
  'markdown': [
    { key: 'content', type: 'string', desc: 'Markdown text', required: true },
  ],
  'image': [
    { key: 'src', type: 'string', desc: 'Image URL', required: true },
    { key: 'alt', type: 'string', desc: 'Alt text' },
    { key: 'caption', type: 'string', desc: 'Caption text' },
  ],
  'callout': [
    { key: 'message', type: 'string', desc: 'Body text', required: true },
    { key: 'title', type: 'string', desc: 'Optional heading' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'State tone (default info) — warn and alarm are announced' },
  ],
  'code': [
    { key: 'content', type: 'string', desc: 'Code text content', required: true },
    { key: 'language', type: 'string', desc: 'Language identifier (e.g. javascript, python, sql)' },
  ],
  'math': [
    { key: 'expression', type: 'string', desc: 'LaTeX math expression', required: true },
  ],
  'header': [
    { key: 'text', type: 'string', desc: 'Heading text', required: true },
    { key: 'level', type: '1 | 2 | 3', desc: 'Heading level (default 2)' },
    { key: 'kicker', type: 'string', desc: 'A line above the heading — a series, a site' },
    { key: 'subtitle', type: 'string', desc: 'A line under the heading' },
    { key: 'date', type: 'string', desc: 'The date it is for, shown in the widget locale' },
    { key: 'time', type: 'string', desc: 'The time it is for — a date-time shows its time of day' },
    { key: 'clock', type: 'boolean', desc: 'Show a running clock (hours and minutes) instead of a time' },
    { key: 'aside', type: 'Array<{ label, value, unit?, format?, tone? }>', desc: 'A few label · value pairs beside the heading' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'The state of the whole, as a badge' },
    { key: 'status', type: 'string', desc: 'The badge\'s words (default: the tone\'s name)' },
  ],
  'video': [
    { key: 'src', type: 'string', desc: 'Video URL', required: true },
    { key: 'poster', type: 'string', desc: 'Poster image URL' },
    { key: 'alt', type: 'string', desc: 'Accessible description' },
    { key: 'caption', type: 'string', desc: 'Caption text' },
    { key: 'tracks', type: 'Array<{ src, srclang?, label?, kind?, default? }>', desc: 'Subtitle / caption tracks (WebVTT). kind: subtitles (default) | captions | descriptions | chapters | metadata' },
  ],
  'gallery': [
    { key: 'src', type: 'string', desc: 'Image URL', required: true },
    { key: 'alt', type: 'string', desc: 'Alt text' },
    { key: 'caption', type: 'string', desc: 'Caption text' },
  ],
  'steps': [
    { key: 'label', type: 'string', desc: 'Step label', required: true },
    { key: 'status', type: '"done" | "active" | "pending" | "error"', desc: 'Step status (default pending)' },
    { key: 'description', type: 'string', desc: 'Step detail text' },
    { key: 'icon', type: 'string', desc: 'Custom icon (emoji/text) override' },
  ],
  'rating': [
    { key: 'value', type: 'number', desc: 'Current rating value' },
    { key: 'max', type: 'number', desc: 'Scale maximum (default 5)' },
    { key: 'count', type: 'number', desc: 'Number of reviews' },
  ],
  'citation': [
    { key: 'title', type: 'string', desc: 'Citation title', required: true },
    { key: 'url', type: 'string', desc: 'Link URL' },
    { key: 'snippet', type: 'string', desc: 'Excerpt text' },
    { key: 'source', type: 'string', desc: 'Source name' },
  ],
  'status-grid': [
    { key: 'label', type: 'string', desc: 'The cell\'s name — a seat, a bed, a bay' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'Its state' },
    { key: 'value', type: 'string | number', desc: 'A value under the name' },
    { key: 'unit', type: 'string', desc: 'The value\'s unit' },
    { key: 'format', type: 'string', desc: 'The value\'s format (number:1, percent, …)' },
  ],
  'status-card': [
    { key: 'title', type: 'string', desc: 'The asset or place', required: true },
    { key: 'subtitle', type: 'string', desc: 'A second line under the name' },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'Its state: stripe, badge colour and mark' },
    { key: 'status', type: 'string', desc: 'The badge\'s words (default: the tone\'s name)' },
    { key: 'emphasis', type: '"invert" | "hatch" | "stamp" | "blink"', desc: 'A second channel besides colour (stamp: the badge as a stamp)' },
    { key: 'readings', type: 'Array<{ label, value, unit?, format?, tone? }>', desc: 'A few label · value pairs' },
    { key: 'meter', type: '{ value, min?, max?, unit?, format?, tone?, form? }', desc: 'A value against its range, as a bar or a ring (form: "ring"; min 0, max 100 unless given)' },
    { key: 'image', type: 'string', desc: 'The card\'s picture: a URL or an inline image (data:image/…)' },
    { key: 'icon', type: 'string', desc: 'A short text or emoji as the picture, when there is no image' },
    { key: 'note', type: 'string', desc: 'A line at the foot' },
  ],
  'status': [
    { key: 'label', type: 'string', desc: 'Status label' },
    { key: 'value', type: 'string', desc: 'Status value', required: true },
    { key: 'tone', type: '"ok" | "info" | "watch" | "warn" | "alarm" | "off" | "idle" | "accent" | "past" | "now" | "next"', desc: 'State tone: colour and mark; without a value the tone\'s name is shown' },
    { key: 'emphasis', type: '"invert" | "hatch" | "stamp" | "blink"', desc: 'A second channel besides colour' },
  ],
});

/** The data fields `widget` reads (`WIDGET_DATA_FIELDS`), each with its name in `locale` (resolved as a widget's locale is). */
export function getWidgetDataFields(widget: string, locale?: string): DataFieldInfo[] {
  return (WIDGET_DATA_FIELDS[widget] ?? []).map(field => ({ ...field, label: dataFieldLabel(widget, field.key, locale) }));
}

/** Auto-inference hints — tells LLM what can be omitted. */
export const WIDGET_INFERENCE: Readonly<Record<string, string>> = {
  'chart.bar': 'mapping omittable. First string → x, number fields → y.',
  'chart.line': 'mapping omittable. First string → x, numbers → y. Date-like preferred for x.',
  'chart.area': 'mapping omittable. Same as line — first string → x, numbers → y.',
  'chart.pie': 'mapping omittable. First string → label, first number → value.',
  'chart.scatter': 'mapping omittable. First two numbers → x, y. color/size optional.',
  'chart.radar': 'mapping omittable. First string → axis, numbers → series values.',
  'chart.heatmap': 'mapping recommended. x, y (categories), value (intensity).',
  'chart.box': 'mapping recommended. x (group), y mapped to [min, q1, median, q3, max].',
  'chart.funnel': 'mapping omittable. First string → label, first number → value.',
  'chart.waterfall': 'mapping omittable. First string → x, first number → y.',
  'chart.treemap': 'No mapping. data is [{name, value, children?}].',
  'chart.histogram': 'Flat number[] or objects with single numeric field → frequency distribution',
  'chart.gantt': 'mapping omittable. First string → y (row), first two number/date-like fields → start, end, next string → label. color groups intervals.',
  'metric': 'No mapping needed. data is {value, label?, unit?, change?, trend?, sparkline?, tone?, meter?, note?}.',
  'stat-group': 'No mapping needed. data is [{label, value, ...}]. Optional: icon (emoji), note (a line under the value), meter.',
  'gauge': 'No mapping needed. data is {value, tone?}. Set min/max/unit, form (arc/vertical/tank/thermometer), band {lo, hi} and marks [{at, label}] in options.',
  'progress': 'No mapping needed. data is {value, max?}. Set label in options.',
  'bar-list': 'No mapping. data is [{label, value, max?, unit?, format?, tone?, note?}]. max (shared scale), form (bar/pictogram), glyph, glyphValue and maxItems in options.',
  'table': 'mapping.columns omittable — auto-inferred from data keys. A column is {field, label?, format?, align?, unit?, tone?, toneField? (a field with this cell’s tone), cell? (text/bar/tone), max? (a bar column’s scale)}; mapping.tone names a field with each row’s tone.',
  'list': 'mapping omittable if data has primary/secondary keys. Otherwise set mapping.',
  'form': 'Uses fields[] or formdown, not data/mapping. data provides defaults. fieldStates (by field name: suggestions, note, decline) offers values to pick.',
  'confirm': 'Uses title, description, actions. data is optional.',
  'markdown': 'No mapping. data is {content: "markdown string"}.',
  'image': 'No mapping. data is {src, alt?, caption?}.',
  'callout': 'No mapping. data is {message, title?, tone?}.',
  'compose': 'Uses children[] and layout. Each child is a widget spec.',
  'kv': 'No mapping. data is {key: val, ...} or [{label, value, unit?, format?, tone?, note?}]. layout in options.',
  'code': 'No mapping. data is {content, language?}. lineNumbers/highlight/maxHeight/wrap in options.',
  'citation': 'No mapping. data is {title, url?, snippet?, source?} or array of those. compact/numbered in options.',
  'status-grid': 'No mapping. data is [{label?, tone, value?, unit?, format?}]. columns, cell (square/chip/dot) and counts in options.',
  'status-card': 'No mapping. data is {title, subtitle?, tone?, status?, emphasis?, readings?: [{label, value, unit?, format?, tone?}], meter?: {value, min?, max?, unit?}, image?, icon?, note?}.',
  'status': 'No mapping. data is {label?, value?, tone?} or array of those. tone: ok/info/watch/warn/alarm/off/idle/accent/past/now/next.',
  'video': 'No mapping. data is {src, poster?, alt?, caption?, tracks?}. autoplay/controls/loop/muted in options.',
  'gallery': 'No mapping. data is [{src, alt?, caption?}]. columns/aspectRatio in options.',
  'steps': 'No mapping. data is [{label, status?, description?, icon?}]. status: done/active/pending/error. icon: emoji/text override. layout: vertical/horizontal.',
  'rating': 'No mapping. data is {value?, max?}. options: interactive, icon (star/heart/thumb), max, label.',
  'math': 'No mapping. data is {expression}. Renders LaTeX via KaTeX. displayMode in options.',
  'actions': 'No data. Uses actions[] array. layout in options (wrap/column).',
  'divider': 'No data. label/spacing in options.',
  'header': 'data is {text, level?, kicker?, subtitle?, date?, time? | clock: true, aside?: [{label, value, unit?}], tone?, status?}. level defaults to 2.',
};

/** Events emitted per widget category. */
export const WIDGET_EVENTS: Readonly<Record<string, readonly string[]>> = {
  chart: ['select'],
  table: ['select'],
  list: ['select'],
  form: ['submit', 'change', 'action'],
  confirm: ['submit', 'action'],
  citation: ['action'],
  rating: ['submit'],
  actions: ['action'],
};

/** Get the event types emitted by a widget. Resolves `chart.*` → `chart`. */
export function getWidgetEvents(widget: string): readonly string[] {
  return WIDGET_EVENTS[widget] ?? WIDGET_EVENTS[widget.split('.')[0]] ?? [];
}
