import type { UWidgetMapping } from './types.js';
import { isDateLikeString } from './utils.js';

/**
 * Auto-infer a mapping from data shape and widget type.
 *
 * Inference rules:
 * - **chart.bar/line/area:** first string field → `x`, number fields → `y`
 * - **chart.pie/funnel:** first string → `label`, first number → `value`
 * - **chart.scatter:** first two number fields → `x`, `y`
 * - **chart.radar:** first string → `axis`, number fields → `y`
 * - **chart.heatmap:** two string fields + number → `x`, `y`, `value`
 * - **chart.box:** string → `x`, five number fields (min/q1/median/q3/max) → `y`
 * - **table:** all keys → `columns`
 * - **list:** first string → `primary`, second string → `secondary`
 * - **metric/gauge/progress/form:** no mapping needed (returns `undefined`)
 *
 * @param widget - Widget type identifier.
 * @param data - The spec's `data` field (object or array of records).
 * @returns Inferred mapping, or `undefined` if not applicable.
 *
 * @example
 * ```ts
 * infer('chart.bar', [{ name: 'A', value: 30 }]);
 * // → { x: 'name', y: 'value' }
 * ```
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

// Debug logging helper — only logs in development builds
function debugInfer(widget: string, message: string): void {
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[u-widget:infer] ${widget}: ${message}`);
  }
}

function inferChart(
  widget: string,
  sample: Record<string, unknown>,
  keys: string[],
): UWidgetMapping | undefined {
  if (widget === 'chart.pie' || widget === 'chart.funnel') {
    const labelField = keys.find((k) => typeof sample[k] === 'string');
    const valueField = keys.find((k) => typeof sample[k] === 'number');
    if (labelField && valueField) {
      return { label: labelField, value: valueField };
    }
    debugInfer(widget, 'needs 1 string + 1 number field');
    return undefined;
  }

  if (widget === 'chart.heatmap') {
    const stringFields = keys.filter((k) => typeof sample[k] === 'string');
    const numberField = keys.find((k) => typeof sample[k] === 'number');
    if (stringFields.length >= 2 && numberField) {
      return { x: stringFields[0], y: stringFields[1], value: numberField };
    }
    debugInfer(widget, 'needs 2 string + 1 number field');
    return undefined;
  }

  if (widget === 'chart.radar') {
    const axisField = keys.find((k) => typeof sample[k] === 'string');
    const numFields = keys.filter((k) => typeof sample[k] === 'number');
    if (axisField && numFields.length > 0) {
      return { axis: axisField, y: numFields.length === 1 ? numFields[0] : numFields };
    }
    debugInfer(widget, 'needs 1 string (axis) + 1+ number field');
    return undefined;
  }

  if (widget === 'chart.box') {
    const numFields = keys.filter((k) => typeof sample[k] === 'number');
    if (numFields.length < 5) return undefined;
    const xField = keys.find((k) => typeof sample[k] === 'string');
    // Try well-known names first, then take first 5 number fields
    const wellKnown = ['min', 'q1', 'median', 'q3', 'max'];
    const matched = wellKnown.filter((name) => numFields.includes(name));
    const statFields = matched.length === 5 ? matched : numFields.slice(0, 5);
    return { x: xField, y: statFields };
  }

  // bar, line, area, scatter → x/y
  // Prefer date-like string fields as x-axis (common time-series pattern)
  const stringFields = keys.filter((k) => typeof sample[k] === 'string');
  const dateField = stringFields.find((k) => isDateLikeString(String(sample[k])));
  const xField = dateField ?? stringFields[0];
  const numFields = keys.filter((k) => typeof sample[k] === 'number');

  if (xField && numFields.length > 0) {
    return { x: xField, y: numFields.length === 1 ? numFields[0] : numFields };
  }

  // scatter: all-numeric data → first number = x, rest = y
  if (widget === 'chart.scatter' && numFields.length >= 2) {
    const [xNum, ...yNums] = numFields;
    return { x: xNum, y: yNums.length === 1 ? yNums[0] : yNums };
  }

  debugInfer(widget, `no suitable fields found (strings: ${keys.filter(k => typeof sample[k] === 'string').length}, numbers: ${numFields.length})`);
  return undefined;
}

function inferTable(keys: string[]): UWidgetMapping {
  return {
    columns: keys.map((k) => ({ field: k })),
  };
}

// Well-known field name sets for list auto-inference
const AVATAR_NAMES = new Set(['avatar', 'image', 'photo', 'picture', 'thumbnail', 'img', 'profileimage', 'profileImage']);
const ICON_NAMES = new Set(['icon', 'emoji', 'symbol']);
const BADGE_NAMES = new Set(['badge', 'tag', 'category']);
const TRAILING_NAMES = new Set(['trailing', 'amount', 'count', 'price', 'status', 'date', 'time']);

function looksLikeUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^https?:\/\/.+/i.test(value);
}

function inferList(
  sample: Record<string, unknown>,
  keys: string[],
): UWidgetMapping | undefined {
  const stringKeys = keys.filter((k) => typeof sample[k] === 'string');
  if (stringKeys.length === 0) return undefined;

  const mapping: UWidgetMapping = {
    primary: stringKeys[0],
    secondary: stringKeys.length > 1 ? stringKeys[1] : undefined,
  };

  // Detect avatar field — well-known name OR URL-like string value
  const usedKeys = new Set([mapping.primary, mapping.secondary].filter(Boolean));
  const avatarKey = keys.find((k) =>
    !usedKeys.has(k) && (AVATAR_NAMES.has(k.toLowerCase()) || (typeof sample[k] === 'string' && AVATAR_NAMES.has(k.toLowerCase())))
  );
  // Also check URL pattern for avatar candidates
  const avatarByUrl = !avatarKey ? keys.find((k) =>
    !usedKeys.has(k) && AVATAR_NAMES.has(k.toLowerCase()) && looksLikeUrl(sample[k])
  ) : undefined;
  const resolvedAvatar = avatarKey ?? avatarByUrl;

  if (resolvedAvatar) {
    mapping.avatar = resolvedAvatar;
    usedKeys.add(resolvedAvatar);
  }

  // Detect icon field — well-known name, mutually exclusive with avatar
  if (!resolvedAvatar) {
    const iconKey = keys.find((k) => !usedKeys.has(k) && ICON_NAMES.has(k.toLowerCase()));
    if (iconKey) {
      mapping.icon = iconKey;
      usedKeys.add(iconKey);
    }
  }

  // Detect trailing field — well-known name, mutually exclusive with primary/secondary
  const trailingKey = keys.find((k) => !usedKeys.has(k) && TRAILING_NAMES.has(k.toLowerCase()));
  if (trailingKey) {
    mapping.trailing = trailingKey;
    usedKeys.add(trailingKey);
  }

  // Detect badge field — well-known name
  const badgeKey = keys.find((k) => !usedKeys.has(k) && BADGE_NAMES.has(k.toLowerCase()));
  if (badgeKey) {
    mapping.badge = badgeKey;
  }

  return mapping;
}

