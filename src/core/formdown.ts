import { FormdownParser } from '@formdown/core/parser';
import { formatFormdown } from '@formdown/core/format';
import type { UWidgetFieldDefinition, UWidgetAction, FieldType } from './types.js';

/**
 * Reads a form written in formdown (`@name*(Label): []`, `@[submit "Save"]`) with `@formdown/core` and
 * turns it into the form widget's `fields` and `actions`. The syntax is formdown's own — this module only
 * maps what the parser reads onto the widget's field and action shapes, and back (`toFormdown`) for the
 * `<formdown-ui>` element that draws the form's fields.
 */
export interface FormdownResult {
  fields: UWidgetFieldDefinition[];
  actions: UWidgetAction[];
  /** What the parser could not read as written — a line that looks like a field but is not one, an unclosed `[`. */
  diagnostics: FormdownDiagnostic[];
}

export interface FormdownDiagnostic {
  severity: 'error' | 'warning';
  message: string;
  /** 1-based line of the formdown text. */
  line?: number;
}

/** The shape of a field as `@formdown/core` reads it — structural, so only what is mapped is named. */
interface FormdownField {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  /** The field's own sentence for the rule its value breaks first (`error-message="…"` in the text). */
  errorMessage?: string;
  options?: { value: string; label?: string }[];
  attributes?: Record<string, unknown>;
}

const FIELD_TYPE_MAP: Record<string, FieldType> = {
  text: 'text',
  email: 'email',
  password: 'password',
  tel: 'tel',
  url: 'url',
  textarea: 'textarea',
  number: 'number',
  select: 'select',
  date: 'date',
  'datetime-local': 'datetime',
  time: 'time',
  range: 'range',
  radio: 'radio',
  checkbox: 'checkbox',
};

function numberOrText(value: unknown): number | string {
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : n;
}

function mapField(f: FormdownField): UWidgetFieldDefinition {
  const a = f.attributes ?? {};
  // formdown writes a select of several values as `s[multiple]`, and a switch as a single checkbox `c[switch]`.
  const single = !f.options || f.options.length === 0;
  const type =
    f.type === 'select' && a.multiple === true
      ? 'multiselect'
      : f.type === 'checkbox' && a.switch === true && single
        ? 'toggle'
        : (FIELD_TYPE_MAP[f.type] ?? 'text');
  const def: UWidgetFieldDefinition = { field: f.name, type };
  if (f.label) def.label = f.label;
  if (f.required) def.required = true;
  const placeholder = f.placeholder ?? a.placeholder;
  if (placeholder != null) def.placeholder = String(placeholder);
  if (f.pattern) def.pattern = f.pattern;
  if (f.errorMessage) def.message = f.errorMessage;
  if (f.options && f.options.length > 0) {
    def.options = f.options.map((o) =>
      o.label !== undefined && o.label !== o.value ? { value: o.value, label: o.label } : o.value,
    );
  }
  if (a.min != null) def.min = numberOrText(a.min);
  if (a.max != null) def.max = numberOrText(a.max);
  if (a.step != null) def.step = Number(a.step);
  if (a.minlength != null) def.minLength = Number(a.minlength);
  if (a.maxlength != null) def.maxLength = Number(a.maxlength);
  if (a.rows != null) def.rows = Number(a.rows);
  return def;
}

/** Which of formdown's fields are buttons — the same split as its `FormManager.getActions()`. */
const BUTTON_TYPES = new Set(['submit', 'reset', 'button', 'image']);

function isButton(f: FormdownField): boolean {
  return BUTTON_TYPES.has(f.type) || BUTTON_TYPES.has(String(f.attributes?.type ?? ''));
}

const ACTION_STYLES = new Set<UWidgetAction['style']>(['primary', 'danger', 'default']);

/**
 * A button's kind is its `type` — the shorthand `@[submit "Save"]` names the button `submit_<random>` and
 * carries the kind in `attributes.type`; the long form `@save: [submit label="Save"]` names it and sets `type`.
 */
function mapAction(f: FormdownField): UWidgetAction {
  const a = f.attributes ?? {};
  const kind = typeof a.type === 'string' && a.type ? a.type : f.type;
  const action: UWidgetAction =
    kind === 'submit'
      ? { action: 'submit', label: f.label || 'Submit', style: 'primary' }
      : kind === 'reset'
        ? { action: 'cancel', label: f.label || 'Cancel', style: 'default' }
        : { action: f.name, label: f.label || f.name };
  if (typeof a.style === 'string' && ACTION_STYLES.has(a.style as UWidgetAction['style'])) {
    action.style = a.style as UWidgetAction['style'];
  }
  return action;
}

/**
 * Parses formdown text into the form widget's fields and actions.
 *
 * @param input - formdown text.
 * @returns The fields, the buttons as actions, and what the parser could not read.
 */
export function parseFormdown(input: string): FormdownResult {
  // The parser alone — `FormManager` would read the text twice (fields, then schema) and bring the data binding.
  const content = new FormdownParser().parseFormdown(input);
  const read = content.forms as FormdownField[];
  return {
    fields: read.filter((f) => !isButton(f)).map(mapField),
    actions: read.filter(isButton).map(mapAction),
    diagnostics: (content.diagnostics ?? []).map((d) => ({
      severity: d.severity === 'error' ? 'error' : 'warning',
      message: d.message,
      ...(d.span?.line != null ? { line: d.span.line } : {}),
    })),
  };
}

/** The widget's field types that formdown writes another way — the inverse of `FIELD_TYPE_MAP` plus the two attribute forms. */
const FORMDOWN_TYPE: Partial<Record<FieldType, string>> = {
  datetime: 'datetime-local',
  multiselect: 'select',
  toggle: 'checkbox',
};

/** One field in the shape `formatFormdown` writes. */
function unmapField(def: UWidgetFieldDefinition): FormdownField {
  const type = def.type ?? 'text';
  const attributes: Record<string, unknown> = {};
  if (type === 'multiselect') attributes.multiple = true;
  if (type === 'toggle') attributes.switch = true;
  if (def.min != null) attributes.min = def.min;
  if (def.max != null) attributes.max = def.max;
  if (def.step != null) attributes.step = def.step;
  if (def.minLength != null) attributes.minlength = def.minLength;
  if (def.maxLength != null) attributes.maxlength = def.maxLength;
  if (def.rows != null) attributes.rows = def.rows;
  const field: FormdownField = { name: def.field, type: FORMDOWN_TYPE[type] ?? type, attributes };
  if (def.label) field.label = def.label;
  if (def.required) field.required = true;
  if (def.placeholder) field.placeholder = def.placeholder;
  if (def.pattern) field.pattern = def.pattern;
  // The field's own sentence for whichever rule its value breaks first, as `setCustomValidity` gives one.
  if (def.message) field.errorMessage = def.message;
  if (def.options && def.options.length > 0) {
    field.options = def.options.map((o) => (typeof o === 'string' ? { value: o } : o));
  }
  return field;
}

/**
 * Writes the form widget's fields as formdown text — what `<formdown-ui>` reads. Buttons are not written: the
 * widget draws its own actions.
 *
 * @param fields - The widget's field definitions.
 * @returns formdown text with one line per field.
 */
export function toFormdown(fields: UWidgetFieldDefinition[]): string {
  return formatFormdown(fields.map(unmapField) as Parameters<typeof formatFormdown>[0]);
}
