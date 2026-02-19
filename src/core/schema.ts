import type { UWidgetSpec, FieldType } from './types.js';
import { getFormdownParser } from './formdown.js';

/** Result of spec validation via {@link validate}. */
export interface ValidationResult {
  /** Whether the spec passed all validation checks. */
  valid: boolean;
  /** Error messages — issues that prevent correct rendering. */
  errors: string[];
  /** Warning messages — non-fatal issues or recommendations. */
  warnings: string[];
}

/** Valid field types for form fields. */
const VALID_FIELD_TYPES = new Set<string>([
  'text', 'email', 'password', 'tel', 'url', 'textarea',
  'number', 'select', 'multiselect', 'date', 'datetime',
  'time', 'toggle', 'range', 'radio', 'checkbox',
] satisfies FieldType[]);

/** Maximum recursion depth for compose children. */
const MAX_COMPOSE_DEPTH = 10;

/** Widgets that expect an array for `data`. */
const ARRAY_DATA = new Set([
  'stat-group', 'table', 'list', 'steps', 'gallery',
  'chart.bar', 'chart.line', 'chart.area', 'chart.pie',
  'chart.scatter', 'chart.radar', 'chart.heatmap', 'chart.box',
  'chart.funnel', 'chart.waterfall', 'chart.treemap',
]);

/** Widgets that expect an object for `data`. */
const OBJECT_DATA = new Set(['metric', 'gauge', 'progress', 'header', 'code', 'rating', 'video']);

/**
 * Validate a u-widget spec.
 *
 * Checks structural correctness: required fields, data type expectations,
 * compose children, field/action definitions. Also validates that mapping
 * fields exist in the data (produces warnings, not errors).
 *
 * @param spec - The spec object to validate (any type accepted for safety).
 * @returns Validation result with `valid`, `errors`, and `warnings`.
 *
 * @example
 * ```ts
 * const result = validate({ widget: 'metric', data: { value: 42 } });
 * console.log(result.valid); // true
 * ```
 */
export function validate(spec: unknown, _depth = 0): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (_depth > MAX_COMPOSE_DEPTH) {
    return { valid: false, errors: ['compose children exceed maximum nesting depth (' + MAX_COMPOSE_DEPTH + ')'], warnings };
  }

  if (spec == null || typeof spec !== 'object') {
    return { valid: false, errors: ['Spec must be a non-null object'], warnings };
  }

  const obj = spec as Record<string, unknown>;

  if (typeof obj.widget !== 'string' || obj.widget.length === 0) {
    errors.push('Required field "widget" must be a non-empty string');
    return { valid: false, errors, warnings };
  }

  const widget = obj.widget as string;

  if (obj.type !== undefined && obj.type !== 'u-widget') {
    errors.push('"type" must be "u-widget" if specified');
  }

  if (obj.fields !== undefined && obj.formdown !== undefined) {
    errors.push('"fields" and "formdown" are mutually exclusive');
  }

  // Data type validation
  if (obj.data !== undefined) {
    if (ARRAY_DATA.has(widget) && !Array.isArray(obj.data)) {
      errors.push(`"${widget}" expects "data" to be an array, got ${typeof obj.data}`);
    }
    if (OBJECT_DATA.has(widget) && (Array.isArray(obj.data) || typeof obj.data !== 'object')) {
      errors.push(`"${widget}" expects "data" to be an object, got ${Array.isArray(obj.data) ? 'array' : typeof obj.data}`);
    }
  }

  if (widget === 'compose') {
    if (!Array.isArray(obj.children)) {
      errors.push('"compose" widget requires a "children" array');
    } else {
      for (let i = 0; i < obj.children.length; i++) {
        const child = obj.children[i];
        if (child == null || typeof child !== 'object' || typeof (child as Record<string, unknown>).widget !== 'string') {
          errors.push(`children[${i}] must be an object with a "widget" field`);
        } else {
          // Recursively validate children with depth tracking
          const childResult = validate(child, _depth + 1);
          if (!childResult.valid) {
            errors.push(...childResult.errors.map(e => `children[${i}]: ${e}`));
          }
          warnings.push(...childResult.warnings.map(w => `children[${i}]: ${w}`));
        }
      }
    }

    if (obj.layout !== undefined) {
      const validLayouts = ['stack', 'row', 'grid'];
      if (!validLayouts.includes(obj.layout as string)) {
        errors.push(`"layout" must be one of: ${validLayouts.join(', ')}`);
      }
    }
  }

  // Validate fields array items
  if (Array.isArray(obj.fields)) {
    for (let i = 0; i < (obj.fields as unknown[]).length; i++) {
      const f = (obj.fields as unknown[])[i] as Record<string, unknown> | null;
      if (f == null || typeof f !== 'object' || typeof f.field !== 'string') {
        errors.push(`fields[${i}] must have a "field" string property`);
      } else if (f.type != null && !VALID_FIELD_TYPES.has(f.type as string)) {
        warnings.push(`fields[${i}].type "${f.type}" is not a recognized field type`);
      }
    }
  }

  // Validate formdown string is parseable
  if (typeof obj.formdown === 'string' && obj.formdown.length > 0 && !obj.fields) {
    try {
      getFormdownParser()(obj.formdown);
    } catch {
      warnings.push('formdown string could not be parsed — check syntax');
    }
  }

  // Validate actions array items
  if (Array.isArray(obj.actions)) {
    for (let i = 0; i < (obj.actions as unknown[]).length; i++) {
      const a = (obj.actions as unknown[])[i] as Record<string, unknown> | null;
      if (a == null || typeof a !== 'object' || typeof a.label !== 'string' || typeof a.action !== 'string') {
        errors.push(`actions[${i}] must have "label" and "action" string properties`);
      }
    }
  }

  // Validate mapping fields against data
  if (obj.mapping && typeof obj.mapping === 'object' && obj.data) {
    const mapping = obj.mapping as Record<string, unknown>;
    const dataKeys = getDataKeys(obj.data);

    if (dataKeys) {
      // Check scalar mapping fields
      for (const key of ['x', 'y', 'label', 'value', 'color', 'size', 'axis', 'primary', 'secondary', 'icon', 'avatar', 'trailing'] as const) {
        const val = mapping[key];
        if (typeof val === 'string' && !dataKeys.has(val)) {
          warnings.push(`mapping.${key} references "${val}" which is not found in data keys [${[...dataKeys].join(', ')}]`);
        }
        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string' && !dataKeys.has(item)) {
              warnings.push(`mapping.${key} references "${item}" which is not found in data keys [${[...dataKeys].join(', ')}]`);
            }
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Extract the set of data field keys from a spec's data. */
function getDataKeys(data: unknown): Set<string> | undefined {
  if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
    return new Set(Object.keys(data[0] as Record<string, unknown>));
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return new Set(Object.keys(data as Record<string, unknown>));
  }
  return undefined;
}

/**
 * Type guard that checks if a value is a valid {@link UWidgetSpec}.
 *
 * Equivalent to `validate(value).valid`, but narrows the TypeScript type.
 *
 * @param value - The value to check.
 * @returns `true` if the value passes validation.
 */
export function isWidgetSpec(value: unknown): value is UWidgetSpec {
  return validate(value).valid;
}
