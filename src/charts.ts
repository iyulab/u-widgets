/**
 * @module u-widgets/charts
 *
 * Separate entry point for chart support. Import this module to enable
 * `chart.*` widget types in `<u-widget>`. Requires `echarts` as a peer dependency.
 *
 * @example
 * ```ts
 * import 'u-widgets';
 * import 'u-widgets/charts';
 *
 * el.spec = { widget: 'chart.bar', data: [...], mapping: { x: 'name', y: 'value' } };
 * ```
 */

export { UChart } from './elements/u-chart.js';
export { toEChartsOption } from './renderers/echarts-adapter.js';
