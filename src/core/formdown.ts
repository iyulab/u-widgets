import type { UWidgetFieldDefinition, UWidgetAction, FieldType } from './types.js';

/**
 * Parse a formdown string into fields and actions.
 *
 * Formdown syntax (subset):
 *   @fieldName*(Label){opt1,opt2}: type[]
 *   @[action "Label"]
 *
 * Type markers:
 *   []     text       @[]    email      #[]    number
 *   ?[]    password   %[]    tel        &[]    url
 *   T{n}[] textarea   d[]    date       dt[]   datetime
 *   t[]    time       s[]    select     r[]    radio
 *   c[]    checkbox   ^[]    toggle     R[]    range
 *   ms[]   multiselect
 *
 *   * = required, (Label) = display label, {a,b,c} = options
 */
export interface FormdownResult {
  fields: UWidgetFieldDefinition[];
  actions: UWidgetAction[];
}

// ── Parser Registry ──

export type FormdownParser = (input: string, data?: Record<string, unknown>) => FormdownResult;

let _externalParser: FormdownParser | null = null;

export function registerFormdownParser(parser: FormdownParser): void {
  _externalParser = parser;
}

export function getFormdownParser(): FormdownParser {
  return _externalParser ?? parseFormdown;
}

// Type marker → field type
const TYPE_MAP: Record<string, string> = {
  '': 'text',
  '@': 'email',
  '#': 'number',
  '?': 'password',
  '%': 'tel',
  '&': 'url',
  'd': 'date',
  'dt': 'datetime',
  't': 'time',
  's': 'select',
  'r': 'radio',
  'c': 'checkbox',
  '^': 'toggle',
  'R': 'range',
  'ms': 'multiselect',
};

// Field line: @fieldName*{opt1,opt2}(Label): marker[]
// Order: field, required(*), options({...}), label((...)), : type
const FIELD_RE =
  /^@(\w+)(\*)?(?:\{([^}]*)\})?(?:\(([^)]*)\))?\s*:\s*(.*)$/;

// Action line: @[action "Label"] or @[action "Label" style]
const ACTION_RE =
  /^@\[\s*(\w+)\s+"([^"]+)"(?:\s+(\w+))?\s*\]$/;

// Type marker: prefix + [] with optional content
const MARKER_RE =
  /^([T@#?%&dts]|dt|c|r|ms|R|\^)?(\d*)?\[([^\]]*)\]$/;

export function parseFormdown(input: string, _data?: Record<string, unknown>): FormdownResult {
  const fields: UWidgetFieldDefinition[] = [];
  const actions: UWidgetAction[] = [];

  const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Try action line
    const actionMatch = ACTION_RE.exec(line);
    if (actionMatch) {
      const action: UWidgetAction = {
        action: actionMatch[1],
        label: actionMatch[2],
      };
      if (actionMatch[3]) {
        action.style = actionMatch[3] as UWidgetAction['style'];
      }
      // Auto-assign style for common actions
      if (action.action === 'submit' && !action.style) action.style = 'primary';
      if (action.action === 'cancel' && !action.style) action.style = 'default';
      actions.push(action);
      continue;
    }

    // Try field line
    const fieldMatch = FIELD_RE.exec(line);
    if (!fieldMatch) continue;

    const fieldName = fieldMatch[1];
    const required = fieldMatch[2] === '*';
    const optionsStr = fieldMatch[3] || undefined;
    const label = fieldMatch[4] || undefined;
    const typeStr = fieldMatch[5].trim();

    const field: UWidgetFieldDefinition = { field: fieldName };
    if (label) field.label = label;
    if (required) field.required = true;
    if (optionsStr) {
      field.options = optionsStr.split(',').map((o) => o.trim());
    }

    // Parse type marker
    const markerMatch = MARKER_RE.exec(typeStr);
    if (markerMatch) {
      const prefix = markerMatch[1] || '';
      const num = markerMatch[2];
      const attrs = markerMatch[3];

      // Textarea: T{n}[]
      if (prefix === 'T') {
        field.type = 'textarea';
        if (num) field.rows = parseInt(num, 10);
      } else {
        field.type = (TYPE_MAP[prefix] ?? 'text') as FieldType;
      }

      // Parse inline attributes: min=X, max=Y
      if (attrs) {
        parseInlineAttrs(attrs, field);
      }
    } else {
      field.type = 'text';
    }

    fields.push(field);
  }

  return { fields, actions };
}

function parseInlineAttrs(attrs: string, field: UWidgetFieldDefinition): void {
  const parts = attrs.split(',').map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    switch (key) {
      case 'min':
        field.min = isNaN(Number(val)) ? val : Number(val);
        break;
      case 'max':
        field.max = isNaN(Number(val)) ? val : Number(val);
        break;
      case 'step':
        field.step = Number(val);
        break;
      case 'maxlength':
        field.maxLength = Number(val);
        break;
      case 'placeholder':
        field.placeholder = val;
        break;
    }
  }
}
