/**
 * @module u-widgets/tools
 *
 * Developer utilities for programmatic widget management.
 * Includes widget catalog, template generation, mapping suggestion,
 * and data-driven auto-spec creation.
 *
 * This is a separate entry point to keep the core bundle small.
 *
 * @example
 * ```ts
 * import { help, template, suggestMapping, autoSpec } from '@iyulab/u-widgets/tools';
 *
 * help('chart')                        // → list chart widget types
 * template('chart.bar')                // → minimal bar chart spec
 * suggestMapping([{ name: 'A', v: 1 }]) // → widget + mapping suggestions
 * autoSpec([{ name: 'A', v: 1 }])       // → ready-to-use spec
 * ```
 */

export { help, template } from './core/catalog.js';
export type { WidgetInfo, WidgetDetail } from './core/catalog.js';
export { suggestMapping, autoSpec } from './core/suggest-mapping.js';
export type { MappingSuggestion } from './core/suggest-mapping.js';
export { specSurface } from './core/spec-surface.js';
export type { SpecSurface, PropInfo } from './core/spec-surface.js';
export {
  MAPPING_DOCS, FIELD_PROP_DOCS, ACTION_PROP_DOCS,
  DATA_FIELD_DOCS, OPTION_DOCS,
  WIDGET_OPTIONS, WIDGET_DATA_FIELDS, WIDGET_INFERENCE,
  WIDGET_EVENTS, getWidgetEvents,
} from './core/widget-meta.js';
export type { DataFieldInfo } from './core/widget-meta.js';
