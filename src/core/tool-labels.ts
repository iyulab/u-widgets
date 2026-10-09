/**
 * Short names for a property editor — what a form shows as a widget's name and as the label of each
 * option and data field ("Minimum", where the description reads "Minimum range value"). They are
 * localizable the way the widgets' own strings are: English is built in, a language registers its
 * names (`@iyulab/u-widgets/tools/locales/ko` for Korean), and the locale resolves as a widget's does
 * (the given locale, else `setDefaultLocale()`, else `<html lang>`).
 *
 * Kept apart from the widgets' chrome strings (`locale.ts`) on purpose: those ship with every page
 * that shows a widget, these only with the `./tools` entry.
 */
import { resolveLocale } from './locale.js';

export interface ToolLabels {
  /** Widget type → its name (`chart.bar` → "Bar chart"). */
  widgets: Record<string, string>;
  /** Option key → its name, for every widget that reads it. */
  options: Record<string, string>;
  /** Data field key → its name, for every widget that reads it. */
  dataFields: Record<string, string>;
  /** Per widget, the names of options that mean something narrower there (`rating.max` is a number of icons). */
  widgetOptions: Record<string, Record<string, string>>;
  /** Per widget, the names of data fields that mean something narrower there (`header.level` is a heading level). */
  widgetDataFields: Record<string, Record<string, string>>;
}

/** Labels for one language: any part, any name — what is left out stays English. */
export type ToolLabelsInput = { [K in keyof ToolLabels]?: Partial<ToolLabels[K]> };

const EN: ToolLabels = {
  widgets: {
    'chart.bar': 'Bar chart',
    'chart.line': 'Line chart',
    'chart.area': 'Area chart',
    'chart.pie': 'Pie chart',
    'chart.scatter': 'Scatter plot',
    'chart.radar': 'Radar chart',
    'chart.heatmap': 'Heatmap',
    'chart.box': 'Box plot',
    'chart.funnel': 'Funnel chart',
    'chart.waterfall': 'Waterfall chart',
    'chart.treemap': 'Treemap',
    'chart.histogram': 'Histogram',
    'chart.gantt': 'Gantt chart',
    'metric': 'Metric',
    'stat-group': 'Stat group',
    'gauge': 'Gauge',
    'progress': 'Progress bar',
    'table': 'Table',
    'list': 'List',
    'form': 'Form',
    'confirm': 'Confirmation',
    'markdown': 'Markdown',
    'image': 'Image',
    'callout': 'Callout',
    'code': 'Code block',
    'citation': 'Citation',
    'status': 'Status',
    'steps': 'Steps',
    'rating': 'Rating',
    'video': 'Video',
    'gallery': 'Gallery',
    'kv': 'Key-value list',
    'math': 'Math',
    'actions': 'Action buttons',
    'divider': 'Divider',
    'header': 'Heading',
    'compose': 'Composition',
  },
  options: {
    min: 'Minimum',
    max: 'Maximum',
    unit: 'Unit',
    thresholds: 'Thresholds',
    label: 'Label',
    smooth: 'Smooth curves',
    stack: 'Stacked',
    horizontal: 'Horizontal',
    donut: 'Donut',
    colors: 'Colors',
    colorRange: 'Color range',
    histogram: 'Histogram',
    bins: 'Bins',
    referenceLines: 'Reference lines',
    categories: 'Row order',
    series: 'Series',
    conditionalStyles: 'Conditional styles',
    subtitle: 'Subtitle',
    step: 'Step line',
    legend: 'Legend',
    grid: 'Grid lines',
    animate: 'Animation',
    showLabel: 'Value labels',
    xFormat: 'X-axis format',
    yFormat: 'Y-axis format',
    pageSize: 'Rows per page',
    compact: 'Compact',
    searchable: 'Search box',
    locale: 'Locale',
    lineNumbers: 'Line numbers',
    highlight: 'Highlighted lines',
    maxHeight: 'Maximum height',
    wrap: 'Wrap lines',
    numbered: 'Numbered',
    interactive: 'Interactive',
    icon: 'Icon',
    autoplay: 'Autoplay',
    controls: 'Playback controls',
    loop: 'Loop',
    muted: 'Muted',
    aspectRatio: 'Aspect ratio',
    displayMode: 'Display mode',
    layout: 'Layout',
    columns: 'Columns',
    widths: 'Column widths',
    spacing: 'Spacing',
    card: 'Card',
  },
  dataFields: {
    value: 'Value',
    label: 'Label',
    unit: 'Unit',
    prefix: 'Prefix',
    suffix: 'Suffix',
    change: 'Change',
    trend: 'Trend',
    icon: 'Icon',
    description: 'Description',
    max: 'Maximum',
    content: 'Content',
    src: 'Source URL',
    alt: 'Alt text',
    caption: 'Caption',
    message: 'Message',
    title: 'Title',
    level: 'Level',
    language: 'Language',
    expression: 'Expression',
    text: 'Text',
    poster: 'Poster image',
    tracks: 'Text tracks',
    status: 'Status',
    count: 'Count',
    url: 'Link',
    snippet: 'Snippet',
    source: 'Source',
  },
  widgetOptions: {
    rating: { max: 'Icons' },
    divider: { label: 'Text' },
  },
  widgetDataFields: {
    header: { level: 'Heading level' },
  },
};

const registry = new Map<string, ToolLabels>();

function merge(labels: ToolLabelsInput): ToolLabels {
  const nested = (part: 'widgetOptions' | 'widgetDataFields') => {
    const result: Record<string, Record<string, string>> = { ...EN[part] };
    for (const [widget, names] of Object.entries(labels[part] ?? {})) {
      result[widget] = { ...result[widget], ...names } as Record<string, string>;
    }
    return result;
  };
  return {
    widgets: { ...EN.widgets, ...labels.widgets } as Record<string, string>,
    options: { ...EN.options, ...labels.options } as Record<string, string>,
    dataFields: { ...EN.dataFields, ...labels.dataFields } as Record<string, string>,
    widgetOptions: nested('widgetOptions'),
    widgetDataFields: nested('widgetDataFields'),
  };
}

/** Register the editor names for a language. What is left out stays English. */
export function registerToolLabels(lang: string, labels: ToolLabelsInput): void {
  registry.set(lang.toLowerCase(), merge(labels));
}

/**
 * The editor names for `locale` — resolved like a widget's locale (`locale`, else `setDefaultLocale()`,
 * else `<html lang>`), then the exact tag, its base language, English.
 */
export function getToolLabels(locale?: string): ToolLabels {
  const lang = resolveLocale(locale)?.toLowerCase();
  if (!lang) return EN;
  return registry.get(lang) ?? registry.get(lang.split('-')[0]) ?? EN;
}

/** The English names (for testing / reference). */
export function getDefaultToolLabels(): ToolLabels {
  return EN;
}

/** A widget type's name, in `locale` — the type itself when it has none. */
export function getWidgetLabel(widget: string, locale?: string): string {
  return getToolLabels(locale).widgets[widget] ?? widget;
}

/** An option's name for `widget`, in `locale` — the key itself when it has none. */
export function optionLabel(widget: string, key: string, locale?: string): string {
  const labels = getToolLabels(locale);
  return labels.widgetOptions[widget]?.[key] ?? labels.options[key] ?? key;
}

/** A data field's name for `widget`, in `locale` — the key itself when it has none. */
export function dataFieldLabel(widget: string, key: string, locale?: string): string {
  const labels = getToolLabels(locale);
  return labels.widgetDataFields[widget]?.[key] ?? labels.dataFields[key] ?? key;
}
