import type { UWidgetSpec, FieldType } from './types.js';
import { getFormdownParser } from './formdown.js';
import { formatTemplate, getDefaultLocale, type UWidgetLocaleStrings } from './locale.js';
import { ARRAY_DATA, isColumnar, toRows } from './tabular.js';

/** What a validation error is about — stable for code to branch on, while its text follows the locale. */
export type SpecErrorCode =
  | 'not-object'
  | 'too-deep'
  | 'widget-required'
  | 'type-invalid'
  | 'fields-formdown-exclusive'
  | 'data-not-array'
  | 'data-not-object'
  | 'children-required'
  | 'child-invalid'
  | 'layout-invalid'
  | 'field-invalid'
  | 'action-invalid';

/** One validation error, as data: its message is {@link specErrorMessage} of it in a locale. */
export interface ValidationIssue {
  code: SpecErrorCode;
  /** Values the message names — the widget, the type it got, an index. */
  params: Record<string, string | number>;
  /** Where in a compose tree the error is (`["children[1]", "children[0]"]`); empty at the top level. */
  path: string[];
}

/** Result of spec validation via {@link validate}. */
export interface ValidationResult {
  /** Whether the spec passed all validation checks. */
  valid: boolean;
  /** Error messages (English) — issues that prevent correct rendering. */
  errors: string[];
  /** The same errors as data, in the same order — for showing them in the reader's language. */
  issues: ValidationIssue[];
  /** Warning messages — non-fatal issues or recommendations. */
  warnings: string[];
}

const MESSAGE_KEY: Record<SpecErrorCode, keyof UWidgetLocaleStrings> = {
  'not-object': 'specErrorNotObject',
  'too-deep': 'specErrorTooDeep',
  'widget-required': 'specErrorWidgetRequired',
  'type-invalid': 'specErrorTypeInvalid',
  'fields-formdown-exclusive': 'specErrorFieldsFormdownExclusive',
  'data-not-array': 'specErrorDataNotArray',
  'data-not-object': 'specErrorDataNotObject',
  'children-required': 'specErrorChildrenRequired',
  'child-invalid': 'specErrorChildInvalid',
  'layout-invalid': 'specErrorLayoutInvalid',
  'field-invalid': 'specErrorFieldInvalid',
  'action-invalid': 'specErrorActionInvalid',
};

/** The message for `issue` in `strings` (English by default), prefixed with its place in a compose tree. */
export function specErrorMessage(issue: ValidationIssue, strings: UWidgetLocaleStrings = getDefaultLocale()): string {
  return [...issue.path, formatTemplate(strings[MESSAGE_KEY[issue.code]], issue.params)].join(': ');
}

function result(issues: ValidationIssue[], warnings: string[]): ValidationResult {
  return { valid: issues.length === 0, errors: issues.map((issue) => specErrorMessage(issue)), issues, warnings };
}

/** Valid field types for form fields. */
const VALID_FIELD_TYPES = new Set<string>([
  'text', 'email', 'password', 'tel', 'url', 'textarea',
  'number', 'select', 'multiselect', 'date', 'datetime',
  'time', 'toggle', 'range', 'radio', 'checkbox',
] satisfies FieldType[]);

/** Maximum recursion depth for compose children. */
const MAX_COMPOSE_DEPTH = 10;

/** Widgets that expect an object for `data`. */
const OBJECT_DATA = new Set(['metric', 'gauge', 'progress', 'header', 'code', 'rating', 'video', 'math']);

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
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];
  const fail = (code: SpecErrorCode, params: Record<string, string | number> = {}) => {
    issues.push({ code, params, path: [] });
  };

  if (_depth > MAX_COMPOSE_DEPTH) {
    fail('too-deep', { max: MAX_COMPOSE_DEPTH });
    return result(issues, warnings);
  }

  if (spec == null || typeof spec !== 'object') {
    fail('not-object');
    return result(issues, warnings);
  }

  const obj = spec as Record<string, unknown>;

  if (typeof obj.widget !== 'string' || obj.widget.length === 0) {
    fail('widget-required');
    return result(issues, warnings);
  }

  const widget = obj.widget as string;

  if (_depth === 0 && obj.type !== undefined && obj.type !== 'u-widget') {
    fail('type-invalid');
  }

  if (obj.fields !== undefined && obj.formdown !== undefined) {
    fail('fields-formdown-exclusive');
  }

  // Data type validation — columns (one array per field) are an array widget's rows (see tabular.ts)
  if (obj.data !== undefined) {
    if (ARRAY_DATA.has(widget) && !Array.isArray(obj.data) && !isColumnar(obj.data)) {
      fail('data-not-array', { widget, got: typeof obj.data });
    }
    if (OBJECT_DATA.has(widget) && (Array.isArray(obj.data) || typeof obj.data !== 'object')) {
      fail('data-not-object', { widget, got: Array.isArray(obj.data) ? 'array' : typeof obj.data });
    }
  }

  if (widget === 'compose') {
    if (!Array.isArray(obj.children)) {
      fail('children-required');
    } else {
      for (let i = 0; i < obj.children.length; i++) {
        const child = obj.children[i];
        if (child == null || typeof child !== 'object' || typeof (child as Record<string, unknown>).widget !== 'string') {
          fail('child-invalid', { index: i });
        } else {
          // Recursively validate children with depth tracking
          const childResult = validate(child, _depth + 1);
          issues.push(...childResult.issues.map((issue) => ({ ...issue, path: [`children[${i}]`, ...issue.path] })));
          warnings.push(...childResult.warnings.map(w => `children[${i}]: ${w}`));
        }
      }
    }

    if (obj.layout !== undefined) {
      const validLayouts = ['stack', 'row', 'grid'];
      if (!validLayouts.includes(obj.layout as string)) {
        fail('layout-invalid', { options: validLayouts.join(', ') });
      }
    }
  }

  // Validate fields array items
  if (Array.isArray(obj.fields)) {
    for (let i = 0; i < (obj.fields as unknown[]).length; i++) {
      const f = (obj.fields as unknown[])[i] as Record<string, unknown> | null;
      if (f == null || typeof f !== 'object' || typeof f.field !== 'string') {
        fail('field-invalid', { index: i });
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
        fail('action-invalid', { index: i });
      }
    }
  }

  // A status item without a `value` draws nothing; with none at all the widget is empty.
  if (widget === 'status' && obj.data && typeof obj.data === 'object') {
    const items = (Array.isArray(obj.data) ? obj.data : [obj.data]) as unknown[];
    items.forEach((item, i) => {
      if (item == null || typeof item !== 'object' || !('value' in item)) {
        warnings.push(Array.isArray(obj.data) ? `data[${i}] has no "value" — the status item is not drawn` : 'data has no "value" — the status widget draws nothing');
      }
    });
  }

  // Validate mapping fields against data
  if (obj.mapping && typeof obj.mapping === 'object' && obj.data) {
    const mapping = obj.mapping as Record<string, unknown>;
    const dataKeys = getDataKeys(toRows(widget, obj.data));

    if (dataKeys) {
      // Check scalar mapping fields
      for (const key of ['x', 'y', 'label', 'value', 'color', 'size', 'axis', 'total', 'start', 'end', 'primary', 'secondary', 'icon', 'avatar', 'trailing'] as const) {
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

  return result(issues, warnings);
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
