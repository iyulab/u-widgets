import type { UWidgetFieldOption } from './types.js';

/**
 * One choice of a select / multiselect / radio / checkbox field, as written in a spec: a bare
 * string is a value shown as itself; `{ value, label }` shows `label` and submits `value`.
 */
export type UWidgetFieldOptionInput = string | UWidgetFieldOption;

/** The value an option submits. */
export function optionValue(option: UWidgetFieldOptionInput): string {
  return typeof option === 'string' ? option : option.value;
}

/** The text an option shows: its label, or the value itself. */
export function optionLabel(option: UWidgetFieldOptionInput): string {
  return typeof option === 'string' ? option : (option.label ?? option.value);
}
