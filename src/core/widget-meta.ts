/**
 * Static description registries extracted from JSON Schema definitions.
 *
 * These registries are the single source of truth for property descriptions
 * shared between the MCP server `help()` output and the demo props panel.
 * Safety tests enforce that every key in the JSON Schema has a corresponding
 * entry here — adding a schema key without a description causes a test failure.
 */

/** Mapping key descriptions (from schema $defs/mapping.properties). */
export const MAPPING_DOCS: Readonly<Record<string, string>> = {
  x: 'X-axis / category field',
  y: 'Y-axis value field(s)',
  label: 'Label field (pie/funnel)',
  value: 'Value field (pie/funnel/heatmap)',
  color: 'Color grouping field (scatter)',
  size: 'Size encoding field (scatter bubble)',
  axis: 'Axis field (radar indicators)',
  columns: 'Column definitions (table)',
  primary: 'Primary text field (list)',
  secondary: 'Secondary text field (list)',
  icon: 'Icon letter field (list)',
  avatar: 'Avatar image URL field (list)',
  trailing: 'Trailing value field (list)',
  badge: 'Badge/tag field (list)',
};

/** Field definition property descriptions (from schema $defs/fieldDefinition). */
export const FIELD_PROP_DOCS: Readonly<Record<string, string>> = {
  field: 'Key name in submitted data',
  label: 'Display label',
  type: 'Input type',
  required: 'Must be filled before submit',
  placeholder: 'Placeholder text',
  options: 'Choices for select/radio/checkbox',
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
  level: 'Severity level (info, warning, error, success)',
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
  thresholds: 'Color threshold breakpoints',
  label: 'Label template ({value}, {percent})',
  // chart
  smooth: 'Smooth curves (line/area)',
  stack: 'Stack series (bar/line/area)',
  horizontal: 'Horizontal orientation (bar)',
  donut: 'Donut style (pie)',
  colors: 'Custom color palette',
  colorRange: 'Heatmap color gradient',
  histogram: 'Histogram mode (bar)',
  referenceLines: 'Reference/threshold lines',
  step: 'Step interpolation (line)',
  legend: 'Show/hide legend',
  grid: 'Show/hide grid lines',
  animate: 'Enable/disable animation',
  showLabel: 'Show/hide data labels',
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
  icon: 'Icon type (star, heart, thumb)',
  // video
  autoplay: 'Auto-play on load (default false)',
  controls: 'Show playback controls (default true)',
  loop: 'Loop playback (default false)',
  muted: 'Start muted (default false, auto when autoplay)',
  // gallery
  aspectRatio: 'Image aspect ratio (e.g. "1:1", "16:9", default auto)',
  // compose / kv / actions / divider / steps
  layout: 'Layout mode (stack, row, grid, horizontal, vertical, wrap, column)',
  columns: 'Number of grid columns',
  widths: 'Column width ratios (number[], "auto", "stretch")',
  spacing: 'Spacing size (small, default, large)',
  card: 'Render inside a card container with shadow and border',
};

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
  readonly type: string;
  readonly desc: string;
  readonly required?: boolean;
}

/** Relevant option keys per widget type. Only lists keys from OPTION_DOCS. */
export const WIDGET_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  'chart.bar': ['stack', 'horizontal', 'histogram', 'colors', 'referenceLines', 'legend', 'grid', 'animate', 'showLabel'],
  'chart.line': ['smooth', 'stack', 'step', 'colors', 'referenceLines', 'legend', 'grid', 'animate', 'showLabel'],
  'chart.area': ['smooth', 'stack', 'colors', 'legend', 'grid', 'animate', 'showLabel'],
  'chart.pie': ['donut', 'colors', 'legend', 'animate', 'showLabel'],
  'chart.scatter': ['colors', 'legend', 'grid', 'animate', 'showLabel'],
  'chart.radar': ['colors', 'legend', 'animate', 'showLabel'],
  'chart.heatmap': ['colorRange', 'legend', 'grid', 'animate', 'showLabel'],
  'chart.box': ['colors', 'legend', 'grid', 'animate'],
  'chart.funnel': ['colors', 'legend', 'animate', 'showLabel'],
  'chart.waterfall': ['colors', 'legend', 'grid', 'animate', 'showLabel'],
  'chart.treemap': ['colors', 'animate', 'showLabel'],
  'metric': [],
  'stat-group': [],
  'gauge': ['min', 'max', 'unit', 'thresholds', 'label'],
  'progress': ['min', 'max', 'unit', 'thresholds', 'label'],
  'table': ['pageSize', 'compact', 'searchable'],
  'list': ['compact'],
  'form': ['locale'],
  'confirm': [],
  'markdown': [],
  'image': [],
  'callout': [],
  'compose': ['layout', 'columns', 'widths', 'card'],
  'kv': ['layout', 'columns'],
  'code': ['lineNumbers', 'highlight', 'maxHeight', 'wrap'],
  'citation': ['compact', 'numbered'],
  'status': [],
  'steps': ['layout', 'compact'],
  'rating': ['max', 'interactive', 'icon', 'label'],
  'video': ['autoplay', 'controls', 'loop', 'muted'],
  'gallery': ['columns', 'aspectRatio'],
  'actions': ['layout'],
  'divider': [],
  'header': [],
};

/**
 * Well-known data fields per widget type.
 * Charts/table/list use user-defined fields so they are omitted.
 */
export const WIDGET_DATA_FIELDS: Readonly<Record<string, readonly DataFieldInfo[]>> = {
  'metric': [
    { key: 'value', type: 'number | string', desc: 'Primary value', required: true },
    { key: 'label', type: 'string', desc: 'Display label' },
    { key: 'unit', type: 'string', desc: 'Value unit suffix' },
    { key: 'prefix', type: 'string', desc: 'Text before value' },
    { key: 'suffix', type: 'string', desc: 'Text after value' },
    { key: 'change', type: 'number', desc: 'Delta amount' },
    { key: 'trend', type: '"up" | "down" | "flat"', desc: 'Trend direction' },
    { key: 'icon', type: 'string', desc: 'Emoji or short text icon' },
    { key: 'description', type: 'string', desc: 'Sub-label below value' },
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
    { key: 'description', type: 'string', desc: 'Sub-label below value' },
  ],
  'gauge': [
    { key: 'value', type: 'number', desc: 'Current value on the arc', required: true },
  ],
  'progress': [
    { key: 'value', type: 'number', desc: 'Current value', required: true },
    { key: 'max', type: 'number', desc: 'Maximum bound (default 100)' },
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
    { key: 'level', type: '"info" | "warning" | "error" | "success"', desc: 'Severity' },
  ],
  'code': [
    { key: 'content', type: 'string', desc: 'Code text content', required: true },
    { key: 'language', type: 'string', desc: 'Language identifier (e.g. javascript, python, sql)' },
  ],
  'header': [
    { key: 'text', type: 'string', desc: 'Heading text', required: true },
    { key: 'level', type: '1 | 2 | 3', desc: 'Heading level (default 2)' },
  ],
  'video': [
    { key: 'src', type: 'string', desc: 'Video URL', required: true },
    { key: 'poster', type: 'string', desc: 'Poster image URL' },
    { key: 'alt', type: 'string', desc: 'Accessible description' },
    { key: 'caption', type: 'string', desc: 'Caption text' },
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
  'status': [
    { key: 'label', type: 'string', desc: 'Status label', required: true },
    { key: 'value', type: 'string', desc: 'Status value', required: true },
    { key: 'level', type: '"info" | "success" | "warning" | "error" | "neutral"', desc: 'Severity level (default info)' },
  ],
};

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
  'metric': 'No mapping needed. data is {value, label?, unit?, change?, trend?}.',
  'stat-group': 'No mapping needed. data is [{label, value, ...}]. Optional: icon (emoji), description (sub-label).',
  'gauge': 'No mapping needed. data is {value}. Set min/max/unit in options.',
  'progress': 'No mapping needed. data is {value, max?}. Set label in options.',
  'table': 'mapping.columns omittable — auto-inferred from data keys.',
  'list': 'mapping omittable if data has primary/secondary keys. Otherwise set mapping.',
  'form': 'Uses fields[] or formdown, not data/mapping. data provides defaults.',
  'confirm': 'Uses title, description, actions. data is optional.',
  'markdown': 'No mapping. data is {content: "markdown string"}.',
  'image': 'No mapping. data is {src, alt?, caption?}.',
  'callout': 'No mapping. data is {message, title?, level?}.',
  'compose': 'Uses children[] and layout. Each child is a widget spec.',
  'kv': 'No mapping. data is {key: val, ...} or [{key, value}]. layout in options.',
  'code': 'No mapping. data is {content, language?}. lineNumbers/highlight/maxHeight/wrap in options.',
  'citation': 'No mapping. data is {title, url?, snippet?, source?} or array of those. compact/numbered in options.',
  'status': 'No mapping. data is {label, value, level?} or array of those. level: info/success/warning/error/neutral.',
  'video': 'No mapping. data is {src, poster?, alt?, caption?}. autoplay/controls/loop/muted in options.',
  'gallery': 'No mapping. data is [{src, alt?, caption?}]. columns/aspectRatio in options.',
  'steps': 'No mapping. data is [{label, status?, description?, icon?}]. status: done/active/pending/error. icon: emoji/text override. layout: vertical/horizontal.',
  'rating': 'No mapping. data is {value?, max?}. options: interactive, icon (star/heart/thumb), max, label.',
  'actions': 'No data. Uses actions[] array. layout in options (wrap/column).',
  'divider': 'No data. label/spacing in options.',
  'header': 'data is {text, level?}. level defaults to 2.',
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
