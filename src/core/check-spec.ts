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
 * - a top-level key no widget reads, an option the widget does not have, an option value of the wrong type, and a
 *   field a reference line or a series does not have (or of the wrong kind) are warnings, each naming what that place takes — and an option of the widget written at the top level says to
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
      else if (key in ITEM_FIELDS && Array.isArray(value)) warnings.push(...itemProblems(key, value));
    }
  }

  return result(base.issues, warnings);
}

type FieldCheck = (value: unknown) => string | undefined;

const ofType = (type: 'string' | 'number'): FieldCheck => (value) => (typeof value === type ? undefined : `should be a ${type}, not ${JSON.stringify(value)}`);
const oneOf = (values: readonly string[]): FieldCheck => (value) =>
  values.includes(value as string) ? undefined : `should be one of ${values.map((v) => `"${v}"`).join(', ')}, not ${JSON.stringify(value)}`;
const LINE_STYLES = ['solid', 'dashed', 'dotted'] as const;

/**
 * The fields of each item of the options that are lists of settings — a misspelt field there (`lineStyle` on a
 * reference line, which takes `style`) is dropped by the chart without a sign, so it is named here.
 */
const ITEM_FIELDS: Record<string, { name: string; fields: Record<string, FieldCheck> }> = {
  referenceLines: {
    name: 'a reference line',
    fields: {
      axis: oneOf(['x', 'y']),
      value: (v) => (typeof v === 'number' || typeof v === 'string' ? undefined : `should be a number or a string, not ${JSON.stringify(v)}`),
      label: ofType('string'),
      color: ofType('string'),
      style: oneOf(LINE_STYLES),
    },
  },
  series: {
    name: 'a series',
    fields: {
      label: ofType('string'),
      color: ofType('string'),
      lineStyle: (v) => (v !== null && typeof v === 'object' && !Array.isArray(v) ? undefined : oneOf(LINE_STYLES)(v)),
      symbol: ofType('string'),
      type: ofType('string'),
      yAxisIndex: ofType('number'),
    },
  },
};

/** What is wrong with the items of the list option `key` — fields it does not have, values of the wrong kind. */
function itemProblems(key: string, items: unknown[]): string[] {
  const { name, fields } = ITEM_FIELDS[key];
  return items.flatMap((item, i) => {
    const at = `options.${key}[${i}]`;
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return [`${at} should be an object`];
    return Object.entries(item as Record<string, unknown>).flatMap(([field, value]) => {
      const check = fields[field];
      if (!check) return [`${at}.${field} is not a field of ${name} — it takes ${Object.keys(fields).join(', ')}`];
      const problem = check(value);
      return problem ? [`${at}.${field} ${problem}`] : [];
    });
  });
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
