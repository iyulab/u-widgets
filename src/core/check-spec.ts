import { help } from './catalog.js';
import { result, validate, type ValidationIssue, type ValidationResult } from './schema.js';
import { WIDGET_OPTIONS, getWidgetOptions } from './widget-meta.js';

/** The top-level keys a spec may carry, besides `widget` — anything else is not read by any widget. */
const SPEC_KEYS = new Set([
  'id', 'title', 'description', 'data', 'mapping', 'fields', 'formdown', 'fieldStates', 'options', 'actions',
  'type', 'version', 'layout', 'columns', 'children', 'span', 'collapsed',
]);

/**
 * Validates a spec as {@link validate} does, and also holds it to what the catalog knows — for a spec someone (or
 * something) wrote by hand, before it is shown:
 *
 * - a `widget` the library does not have is an error (it would draw nothing useful);
 * - a top-level key no widget reads, an option the widget does not have, and an option value of the wrong type
 *   are warnings, each naming what that place takes — and an option of the widget written at the top level says to
 *   move it into `options`.
 *
 * `validate` stays the lighter check a renderer runs; this one needs the catalog, so it lives in `./tools`.
 */
export function checkSpec(spec: unknown): ValidationResult {
  const base = validate(spec);
  if (!base.valid || spec === null || typeof spec !== 'object') return base;
  const obj = spec as Record<string, unknown>;
  const widget = obj.widget as string;
  const known = help().map((info) => info.widget);
  const warnings = [...base.warnings];

  if (!known.includes(widget)) {
    const issue: ValidationIssue = { code: 'widget-unknown', params: { widget }, path: [] };
    const near = known.filter((name) => oneEditApart(name, widget) || oneEditApart(name.split('.').pop() ?? name, widget));
    if (near.length) warnings.push(`did you mean ${near.map((n) => `"${n}"`).join(', ')}?`);
    return result([issue], warnings);
  }

  const optionKeys = new Set(widget in WIDGET_OPTIONS ? getWidgetOptions(widget).map((info) => info.key) : []);
  for (const key of Object.keys(obj)) {
    if (key === 'widget' || SPEC_KEYS.has(key)) continue;
    warnings.push(optionKeys.has(key)
      ? `"${key}" is an option of ${widget} — put it in options: { "${key}": … }`
      : `"${key}" is not read by any widget — a spec takes ${[...SPEC_KEYS].join(', ')}`);
  }

  const options = obj.options;
  if (options !== undefined && (options === null || typeof options !== 'object' || Array.isArray(options))) {
    warnings.push('options should be an object');
  } else if (options && widget in WIDGET_OPTIONS) {
    const allowed = new Map(getWidgetOptions(widget).map((info) => [info.key, info]));
    for (const [key, value] of Object.entries(options as Record<string, unknown>)) {
      const info = allowed.get(key);
      if (!info) {
        warnings.push(allowed.size
          ? `options.${key} is not an option of ${widget} — it takes ${[...allowed.keys()].join(', ')}`
          : `options.${key} is not an option of ${widget} — it takes none`);
        continue;
      }
      const problem = typeProblem(value, info.type, info.enum);
      if (problem) warnings.push(`options.${key} ${problem}`);
    }
  }

  return result(base.issues, warnings);
}

/** Whether `typed` is `target` with one letter added, dropped or changed. */
function oneEditApart(target: string, typed: string): boolean {
  if (typed.length < 3 || Math.abs(target.length - typed.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < target.length && j < typed.length) {
    if (target[i] === typed[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (target.length > typed.length) i++;
    else if (typed.length > target.length) j++;
    else { i++; j++; }
  }
  return edits + (target.length - i) + (typed.length - j) <= 1;
}

/** What is wrong with `value` for an option of `type` — only the simple types are judged; a structured one passes. */
function typeProblem(value: unknown, type: string, values?: readonly string[]): string | undefined {
  if (values) return values.includes(value as string) ? undefined : `should be one of ${values.map((v) => `"${v}"`).join(', ')}, not ${JSON.stringify(value)}`;
  if (type === 'number' || type === 'string' || type === 'boolean') {
    return typeof value === type ? undefined : `should be a ${type}, not ${JSON.stringify(value)}`;
  }
  if (type === 'string[]') {
    return Array.isArray(value) && value.every((v) => typeof v === 'string') ? undefined : `should be a list of strings, not ${JSON.stringify(value)}`;
  }
  return undefined;
}
