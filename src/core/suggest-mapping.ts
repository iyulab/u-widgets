/**
 * Suggest widget type and mapping from raw data shape.
 *
 * Analyzes the structure of the provided data and recommends
 * the most appropriate widget type with an auto-generated mapping.
 */

import type { UWidgetSpec, UWidgetMapping } from './types.js';
import { infer } from './infer.js';
import { isDateLikeString } from './utils.js';

/** A widget + mapping recommendation. */
export interface MappingSuggestion {
  /** Recommended widget type. */
  widget: string;
  /** Suggested mapping for the widget. */
  mapping?: UWidgetMapping;
  /** Confidence score (0–1). Higher means better fit. */
  confidence: number;
  /** Human-readable reason for this suggestion. */
  reason: string;
}

/**
 * Suggest widget type and mapping from data alone.
 *
 * Analyzes data structure (keys, types, shape) and returns
 * ranked suggestions. If a widget type is provided, only suggests
 * a mapping for that specific widget.
 *
 * @param data - The data to analyze (object or array of records).
 * @param widget - Optional widget type to constrain the suggestion.
 * @returns Array of suggestions sorted by confidence (highest first).
 *
 * @example
 * ```ts
 * suggestMapping([{ name: 'A', value: 30 }, { name: 'B', value: 70 }])
 * // → [{ widget: 'chart.bar', mapping: { x: 'name', y: 'value' }, confidence: 0.9, ... }, ...]
 * ```
 */
export function suggestMapping(
  data: Record<string, unknown> | Record<string, unknown>[],
  widget?: string,
): MappingSuggestion[] {
  if (data == null) return [];

  const records = Array.isArray(data) ? data : [data];
  if (records.length === 0) return [];

  const sample = records[0];
  const keys = Object.keys(sample);
  if (keys.length === 0) return [];

  const stringKeys = keys.filter((k) => typeof sample[k] === 'string');
  const numberKeys = keys.filter((k) => typeof sample[k] === 'number');
  const isArray = Array.isArray(data);

  // If widget is specified, just suggest mapping for that widget
  if (widget) {
    const mapping = infer(widget, data);
    if (mapping) {
      return [{ widget, mapping, confidence: 0.8, reason: `Auto-inferred mapping for ${widget}` }];
    }
    return [{ widget, confidence: 0.3, reason: `No mapping could be inferred for ${widget} from this data shape` }];
  }

  const suggestions: MappingSuggestion[] = [];

  // Single object with 'value' key → metric
  if (!isArray && numberKeys.includes('value')) {
    suggestions.push({
      widget: 'metric',
      confidence: 0.95,
      reason: 'Object data with "value" key is ideal for a metric widget',
    });
  }

  // Array with 1 string + 1 number → chart.bar
  if (isArray && stringKeys.length >= 1 && numberKeys.length >= 1) {
    const mapping = infer('chart.bar', data);
    suggestions.push({
      widget: 'chart.bar',
      mapping,
      confidence: numberKeys.length === 1 ? 0.9 : 0.7,
      reason: 'Category × value pattern detected',
    });
  }

  // Array with 1 string + multiple numbers → chart.line (multi-series)
  if (isArray && stringKeys.length >= 1 && numberKeys.length >= 2) {
    const mapping = infer('chart.line', data);
    suggestions.push({
      widget: 'chart.line',
      mapping,
      confidence: 0.8,
      reason: 'Category × multiple values pattern detected (multi-series)',
    });
  }

  // Array with date-like strings + numbers → chart.area (time-series)
  if (isArray && stringKeys.length >= 1 && numberKeys.length >= 1) {
    const hasDateField = stringKeys.some((k) =>
      isDateLikeString(String(records[0][k])));
    if (hasDateField) {
      const mapping = infer('chart.area', data);
      suggestions.push({
        widget: 'chart.area',
        mapping,
        confidence: 0.75,
        reason: 'Date-like category field detected — suitable for time-series area chart',
      });
    }
  }

  // Array with label+value → chart.pie
  if (isArray && stringKeys.length >= 1 && numberKeys.length === 1) {
    const mapping = infer('chart.pie', data);
    suggestions.push({
      widget: 'chart.pie',
      mapping,
      confidence: 0.6,
      reason: 'Label + value pattern could work as proportions',
    });
  }

  // Array with 2+ number fields, no string → chart.scatter
  if (isArray && numberKeys.length >= 2 && stringKeys.length === 0) {
    const mapping = infer('chart.scatter', data);
    suggestions.push({
      widget: 'chart.scatter',
      mapping,
      confidence: 0.85,
      reason: 'All-numeric data is ideal for scatter plot',
    });
  }

  // Array with multiple fields → table
  if (isArray && keys.length >= 2) {
    suggestions.push({
      widget: 'table',
      mapping: infer('table', data),
      confidence: 0.75,
      reason: 'Multi-field array renders well as a table',
    });
  }

  // Array with name-like fields → list
  if (isArray && stringKeys.length >= 1) {
    const mapping = infer('list', data);
    suggestions.push({
      widget: 'list',
      mapping,
      confidence: 0.5,
      reason: 'String fields can display as a list',
    });
  }

  // Single object with value + min/max → progress
  if (!isArray && numberKeys.includes('value') && (numberKeys.includes('min') || numberKeys.includes('max'))) {
    suggestions.push({
      widget: 'progress',
      confidence: 0.85,
      reason: 'Object with "value" and "min"/"max" is ideal for a progress bar',
    });
  }

  // Single object with value → gauge (lower priority than metric/progress)
  if (!isArray && numberKeys.includes('value')) {
    suggestions.push({
      widget: 'gauge',
      confidence: 0.7,
      reason: 'Object with "value" can display as a gauge',
    });
  }

  // Array with 2+ numbers and a string → chart.radar
  if (isArray && stringKeys.length >= 1 && numberKeys.length >= 2) {
    const mapping = infer('chart.radar', data);
    if (mapping) {
      suggestions.push({
        widget: 'chart.radar',
        mapping,
        confidence: 0.6,
        reason: 'Category × multiple values can display as a radar chart',
      });
    }
  }

  // Array with 2 string + 1 number → chart.heatmap
  if (isArray && stringKeys.length >= 2 && numberKeys.length >= 1) {
    const mapping = infer('chart.heatmap', data);
    if (mapping) {
      suggestions.push({
        widget: 'chart.heatmap',
        mapping,
        confidence: 0.65,
        reason: 'Two categories × value pattern suits a heatmap',
      });
    }
  }

  // Array with 5+ numbers → chart.box
  if (isArray && numberKeys.length >= 5) {
    const mapping = infer('chart.box', data);
    if (mapping) {
      suggestions.push({
        widget: 'chart.box',
        mapping,
        confidence: 0.7,
        reason: 'Five or more numeric fields fit a box plot (min/q1/median/q3/max)',
      });
    }
  }

  // Array with label+value (same as pie) → chart.funnel
  if (isArray && stringKeys.length >= 1 && numberKeys.length === 1) {
    const mapping = infer('chart.funnel', data);
    if (mapping) {
      suggestions.push({
        widget: 'chart.funnel',
        mapping,
        confidence: 0.45,
        reason: 'Label + value pattern can display as a funnel',
      });
    }
  }

  // Array with label+value → chart.waterfall
  if (isArray && stringKeys.length >= 1 && numberKeys.length >= 1) {
    const mapping = infer('chart.waterfall', data);
    if (mapping) {
      suggestions.push({
        widget: 'chart.waterfall',
        mapping,
        confidence: 0.4,
        reason: 'Category × value pattern can display as a waterfall chart',
      });
    }
  }

  // Array with label+value → chart.treemap
  if (isArray && stringKeys.length >= 1 && numberKeys.length >= 1) {
    const mapping = infer('chart.treemap', data);
    if (mapping) {
      suggestions.push({
        widget: 'chart.treemap',
        mapping,
        confidence: 0.35,
        reason: 'Category × value pattern can display as a treemap',
      });
    }
  }

  // Array of objects with label/value/suffix → stat-group
  if (isArray && keys.includes('label') && keys.includes('value')) {
    suggestions.push({
      widget: 'stat-group',
      confidence: 0.85,
      reason: 'Array with "label" and "value" keys matches stat-group pattern',
    });
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

/**
 * Generate a complete spec suggestion from data.
 *
 * Convenience wrapper: picks the top suggestion and returns a ready-to-use spec.
 *
 * @param data - The data to analyze.
 * @returns A complete spec, or `undefined` if no suggestion could be made.
 */

export function autoSpec(data: Record<string, unknown> | Record<string, unknown>[]): UWidgetSpec | undefined {
  const suggestions = suggestMapping(data);
  if (suggestions.length === 0) return undefined;

  const top = suggestions[0];
  const spec: UWidgetSpec = { widget: top.widget, data };
  if (top.mapping) spec.mapping = top.mapping;
  return spec;
}
