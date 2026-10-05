// @formdown/core Field → u-widgets type adapter
// Uses structural typing so @formdown/core install is not required at compile time.

import type { UWidgetFieldDefinition, UWidgetAction, FieldType } from '../core/types.js';

// Structural interface matching @formdown/core Field shape
export interface FormdownField {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  /** `@formdown/core` 0.15+: `value=Label` keeps the value apart from the text shown. */
  options?: { value: string; label?: string }[];
  attributes?: Record<string, string>;
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
  multiselect: 'multiselect',
  date: 'date',
  datetime: 'datetime',
  'datetime-local': 'datetime',
  time: 'time',
  toggle: 'toggle',
  range: 'range',
  radio: 'radio',
  checkbox: 'checkbox',
};

export function mapFieldType(type: string): FieldType {
  return FIELD_TYPE_MAP[type] ?? 'text';
}

export function mapFields(fields: FormdownField[]): UWidgetFieldDefinition[] {
  return fields.map((f) => {
    const def: UWidgetFieldDefinition = {
      field: f.name,
      type: mapFieldType(f.type),
    };
    if (f.label) def.label = f.label;
    if (f.required) def.required = true;
    if (f.placeholder) def.placeholder = f.placeholder;
    if (f.options && f.options.length > 0) {
      def.options = f.options.map((o) =>
        o.label !== undefined && o.label !== o.value ? { value: o.value, label: o.label } : o.value,
      );
    }

    // Extract numeric/string attributes
    if (f.attributes) {
      const a = f.attributes;
      if (a.min != null) def.min = isNaN(Number(a.min)) ? a.min : Number(a.min);
      if (a.max != null) def.max = isNaN(Number(a.max)) ? a.max : Number(a.max);
      if (a.step != null) def.step = Number(a.step);
      if (a.maxlength != null) def.maxLength = Number(a.maxlength);
      if (a.rows != null) def.rows = Number(a.rows);
    }

    return def;
  });
}

/**
 * 버튼의 종류 — `@formdown/core` 는 단축형 `@[submit "Save"]` 의 이름을 `submit_<무작위>` 로 만들고
 * 종류를 `attributes.type` 에 싣는다(0.4 ~ 0.10 실측). 이름으로 판정하면 저장·초기화를 알아보지 못한다.
 */
function actionKind(a: FormdownField): string {
  const declared = a.attributes?.type;
  return typeof declared === 'string' && declared ? declared : a.name;
}

export function mapActions(actions: FormdownField[]): UWidgetAction[] {
  return actions.map((a) => {
    const kind = actionKind(a);
    const action: UWidgetAction = {
      action: kind === 'reset' ? 'cancel' : kind === 'submit' ? 'submit' : a.name,
      label: a.label || (kind === 'submit' || kind === 'reset' ? kind : a.name),
    };
    if (kind === 'submit') action.style = 'primary';
    else if (kind === 'reset') action.style = 'default';
    return action;
  });
}
