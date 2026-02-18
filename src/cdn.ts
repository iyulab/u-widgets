/**
 * CDN entry point — single script that registers `<u-widget>` with chart support.
 *
 * Usage:
 * ```html
 * <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
 * <script src="https://cdn.jsdelivr.net/npm/@iyulab/u-widgets/dist/u-widgets.global.js"></script>
 * ```
 *
 * Without charts (no echarts dependency needed):
 * ```html
 * <script src="https://cdn.jsdelivr.net/npm/@iyulab/u-widgets/dist/u-widgets.global.js"></script>
 * ```
 *
 * Chart types (`chart.*`) only work when echarts is loaded before this script.
 */

// Core: registers <u-widget> and all non-chart sub-elements
export { UWidget } from './elements/u-widget.js';

// Core utilities
export { validate, isWidgetSpec } from './core/schema.js';
export { infer } from './core/infer.js';
export { normalize } from './core/normalize.js';
export { formatValue } from './core/format.js';
export { suggestWidget } from './core/suggest.js';
export { help, template } from './core/catalog.js';
export { suggestMapping, autoSpec } from './core/suggest-mapping.js';
export { parseFormdown } from './core/formdown.js';

// Charts: registers <u-chart> (only functional if echarts is available at runtime)
export { UChart } from './elements/u-chart.js';
export { toEChartsOption } from './renderers/echarts-adapter.js';
