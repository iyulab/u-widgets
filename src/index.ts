// u-widgets — Declarative, data-driven widget system
// Public API: <u-widget> custom element + core utilities

export type {
  UWidgetSpec,
  UWidgetChildSpec,
  UWidgetMapping,
  UWidgetAction,
  UWidgetFieldDefinition,
  UWidgetColumnDefinition,
  UWidgetEvent,
  WidgetType,
  ChartType,
  FieldType,
} from './core/types.js';

export { validate, isWidgetSpec } from './core/schema.js';
export type { ValidationResult } from './core/schema.js';
export { infer } from './core/infer.js';
export { normalize } from './core/normalize.js';
export { parseFormdown, registerFormdownParser, getFormdownParser } from './core/formdown.js';
export type { FormdownResult, FormdownParser } from './core/formdown.js';
export { formatValue } from './core/format.js';

export { UWidget } from './elements/u-widget.js';
