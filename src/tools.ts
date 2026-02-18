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
export type { WidgetInfo } from './core/catalog.js';
export { suggestMapping, autoSpec } from './core/suggest-mapping.js';
export type { MappingSuggestion } from './core/suggest-mapping.js';
