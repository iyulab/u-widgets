import { FormdownParser } from '@formdown/core/parser';
import type { UWidgetFieldDefinition, UWidgetAction, FieldType } from './types.js';

/**
 * Reads a form written in formdown (`@name*(Label): []`, `@[submit "Save"]`) with `@formdown/core` and
 * turns it into the form widget's `fields` and `actions`. The syntax is formdown's own — this module only
 * maps what the parser reads onto the widget's field and action shapes.
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
  // formdown writes a select of several values as `s[multiple]`.
  const type = f.type === 'select' && a.multiple === true ? 'multiselect' : (FIELD_TYPE_MAP[f.type] ?? 'text');
  const def: UWidgetFieldDefinition = { field: f.name, type };
  if (f.label) def.label = f.label;
  if (f.required) def.required = true;
  const placeholder = f.placeholder ?? a.placeholder;
  if (placeholder != null) def.placeholder = String(placeholder);
  if (f.pattern) def.pattern = f.pattern;
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
