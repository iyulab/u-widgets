import type { UWidgetSpec } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a u-widget spec. Returns validation result with error messages. */
export function validate(spec: unknown): ValidationResult {
  const errors: string[] = [];

  if (spec == null || typeof spec !== 'object') {
    return { valid: false, errors: ['Spec must be a non-null object'] };
  }

  const obj = spec as Record<string, unknown>;

  if (typeof obj.widget !== 'string' || obj.widget.length === 0) {
    errors.push('Required field "widget" must be a non-empty string');
  }

  if (obj.type !== undefined && obj.type !== 'u-widget') {
    errors.push('"type" must be "u-widget" if specified');
  }

  if (obj.fields !== undefined && obj.formdown !== undefined) {
    errors.push('"fields" and "formdown" are mutually exclusive');
  }

  if (obj.widget === 'compose') {
    if (!Array.isArray(obj.children)) {
      errors.push('"compose" widget requires a "children" array');
    } else {
      for (let i = 0; i < obj.children.length; i++) {
        const child = obj.children[i];
        if (child == null || typeof child !== 'object' || typeof (child as Record<string, unknown>).widget !== 'string') {
          errors.push(`children[${i}] must be an object with a "widget" field`);
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
      }
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

  return { valid: errors.length === 0, errors };
}

/** Type guard: check if a value is a valid UWidgetSpec (has required fields). */
export function isWidgetSpec(value: unknown): value is UWidgetSpec {
  return validate(value).valid;
}
