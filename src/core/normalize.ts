import type { UWidgetSpec, NormalizedMapping, UWidgetMapping } from './types.js';
import { getFormdownParser } from './formdown.js';

/**
 * Normalize a spec for internal processing:
 * - mapping.y: string → string[]
 * - mapping.fields (deprecated) → top-level fields
 * - formdown string → fields + actions
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
    const parser = getFormdownParser();
    const parsed = parser(result.formdown, result.data as Record<string, unknown> | undefined);
    result.fields = parsed.fields;
    if (parsed.actions.length > 0 && !result.actions) {
      result.actions = parsed.actions;
    }
  }

  return result;
}

/** Normalize mapping.y to always be string[]. */
export function normalizeMapping(mapping: UWidgetMapping): NormalizedMapping {
  const { y, ...rest } = mapping;
  return {
    ...rest,
    y: y == null ? undefined : typeof y === 'string' ? [y] : y,
  };
}
