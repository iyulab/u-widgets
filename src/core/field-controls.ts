import type { TemplateResult } from 'lit';
import type { FieldType, UWidgetFieldDefinition } from './types.js';

/** What a field control needs from the form that renders it. */
export interface FieldControlContext {
  field: UWidgetFieldDefinition;
  /** The field's current value (`undefined` when empty). */
  value: unknown;
  /** The id the form's `<label for>` points at. */
  id: string;
  hasError: boolean;
  /** Id of the field's error message, when one is shown. */
  errorId?: string;
  /** Report a new value — same contract as the built-in controls. */
  onChange(value: unknown): void;
}

export type FieldControlRenderer = (ctx: FieldControlContext) => TemplateResult;

const renderers = new Map<FieldType, FieldControlRenderer>();

/**
 * Replace the control `uw-form` draws for a field type. Internal seam for optional entry points
 * (`u-widgets/components`) — an application opts in by importing that entry, not by calling this.
 */
export function registerFieldControl(type: FieldType, renderer: FieldControlRenderer): void {
  renderers.set(type, renderer);
}

export function getFieldControl(type: FieldType): FieldControlRenderer | undefined {
  return renderers.get(type);
}
