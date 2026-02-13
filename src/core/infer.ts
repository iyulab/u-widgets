import type { UWidgetMapping } from './types.js';

/**
 * Auto-infer mapping from data shape and widget type.
 * Returns inferred mapping, or undefined if inference is not applicable.
 */
export function infer(
  widget: string,
  data: Record<string, unknown> | Record<string, unknown>[] | undefined,
): UWidgetMapping | undefined {
  if (data == null) return undefined;

  const records = Array.isArray(data) ? data : [data];
  if (records.length === 0) return undefined;

  const sample = records[0];
  const keys = Object.keys(sample);
  if (keys.length === 0) return undefined;

  // chart.* → x (first string), y (first number)
  if (widget.startsWith('chart.')) {
    return inferChart(widget, sample, keys);
  }

  // table → all keys as columns
  if (widget === 'table') {
    return inferTable(keys);
  }

  // list → first string as primary, second as secondary
  if (widget === 'list') {
    return inferList(sample, keys);
  }

  // metric, gauge, progress, stat-group → no mapping needed
  // form, confirm → handled by fields, not mapping
  return undefined;
}

function inferChart(
  widget: string,
  sample: Record<string, unknown>,
  keys: string[],
): UWidgetMapping | undefined {
  if (widget === 'chart.pie') {
    const labelField = keys.find((k) => typeof sample[k] === 'string');
    const valueField = keys.find((k) => typeof sample[k] === 'number');
    if (labelField && valueField) {
      return { label: labelField, value: valueField };
    }
    return undefined;
  }

  if (widget === 'chart.radar') {
    const axisField = keys.find((k) => typeof sample[k] === 'string');
    const valueField = keys.find((k) => typeof sample[k] === 'number');
    if (axisField && valueField) {
      return { axis: axisField, value: valueField };
    }
    return undefined;
  }

  // bar, line, area, scatter → x/y
  const xField = keys.find((k) => typeof sample[k] === 'string');
  const numFields = keys.filter((k) => typeof sample[k] === 'number');

  if (xField && numFields.length > 0) {
    return { x: xField, y: numFields.length === 1 ? numFields[0] : numFields };
  }

  // scatter: all-numeric data → first number = x, rest = y
  if (widget === 'chart.scatter' && numFields.length >= 2) {
    const [xNum, ...yNums] = numFields;
    return { x: xNum, y: yNums.length === 1 ? yNums[0] : yNums };
  }

  return undefined;
}

function inferTable(keys: string[]): UWidgetMapping {
  return {
    columns: keys.map((k) => ({ field: k })),
  };
}

function inferList(
  sample: Record<string, unknown>,
  keys: string[],
): UWidgetMapping | undefined {
  const stringKeys = keys.filter((k) => typeof sample[k] === 'string');
  if (stringKeys.length === 0) return undefined;
  return {
    primary: stringKeys[0],
    secondary: stringKeys.length > 1 ? stringKeys[1] : undefined,
  };
}
