/**
 * Widget types rendered by an element that ships in a separate entry point.
 *
 * `<u-widget>` only renders these once their entry has been imported (the entry registers the
 * element and pulls in its peer dependency). Build tools can use this map to check statically that
 * every widget type a page renders has its entry imported.
 */

import { KNOWN_WIDGETS } from './suggest.js';

/** The separate entry point a widget type needs, and the element that entry registers. */
export interface WidgetEntry {
  /** Import specifier of the entry point, e.g. `'@iyulab/u-widgets/charts'`. */
  entry: string;
  /** Custom element the entry registers, e.g. `'uw-chart'`. */
  element: string;
}

const CHARTS: WidgetEntry = { entry: '@iyulab/u-widgets/charts', element: 'uw-chart' };
const MATH: WidgetEntry = { entry: '@iyulab/u-widgets/math', element: 'uw-math' };

/**
 * The entry point a known widget type needs beyond the core import, or `undefined` when the core
 * entry renders it (or the type is not a known widget).
 *
 * @example
 * ```ts
 * widgetEntry('chart.waterfall') // → { entry: '@iyulab/u-widgets/charts', element: 'uw-chart' }
 * widgetEntry('math')            // → { entry: '@iyulab/u-widgets/math', element: 'uw-math' }
 * widgetEntry('metric')          // → undefined
 * ```
 */
export function widgetEntry(widget: string): WidgetEntry | undefined {
  if (!KNOWN_WIDGETS.includes(widget)) return undefined;
  if (widget.startsWith('chart.')) return CHARTS;
  if (widget === 'math') return MATH;
  return undefined;
}
