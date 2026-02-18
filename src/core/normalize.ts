import type { UWidgetSpec, NormalizedMapping, UWidgetMapping } from './types.js';
import { getFormdownParser } from './formdown.js';

/**
 * Normalize a spec for internal processing.
 *
 * Transformations applied:
 * 1. Deprecated `mapping.fields` → top-level `fields`
 * 2. `formdown` string → parsed `fields` + `actions`
 *
 * Returns a shallow copy; the original spec is not mutated.
 *
 * @param spec - The widget spec to normalize.
 * @returns A normalized copy of the spec.
 */
export function normalize(spec: UWidgetSpec): UWidgetSpec {
  const result = { ...spec };

  // Normalize deprecated mapping.fields → top-level fields
  if (result.mapping && 'fields' in result.mapping && !result.fields) {
    const { fields, ...restMapping } = result.mapping as UWidgetMapping & {
      fields?: UWidgetSpec['fields'];
    };
    result.fields = fields;
    result.mapping = Object.keys(restMapping).length > 0 ? restMapping : undefined;
  }

  // Normalize formdown → fields + actions
  if (result.formdown && !result.fields) {
    try {
      const parser = getFormdownParser();
      const parsed = parser(result.formdown, result.data as Record<string, unknown> | undefined);
      result.fields = parsed.fields;
      if (parsed.actions.length > 0 && !result.actions) {
        result.actions = parsed.actions;
      }
    } catch (e) {
      console.warn('[u-widget:normalize] Failed to parse formdown:', (e as Error).message);
    }
  }

  return result;
}

/**
 * Normalize `mapping.y` to always be `string[]`.
 *
 * Converts `y: "field"` → `y: ["field"]` and passes arrays through unchanged.
 *
 * @param mapping - The original mapping from a widget spec.
 * @returns A new mapping object with `y` guaranteed to be `string[]` or `undefined`.
 */
export function normalizeMapping(mapping: UWidgetMapping): NormalizedMapping {
  const { y, ...rest } = mapping;
  return {
    ...rest,
    y: y == null ? undefined : typeof y === 'string' ? [y] : y,
  };
}
