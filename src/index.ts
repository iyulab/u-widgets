/**
 * @module u-widgets
 *
 * Declarative, data-driven widget system for visualization and input.
 *
 * **Entry points:**
 * - `u-widgets` — Core element `<u-widget>` + utility functions (this module)
 * - `u-widgets/charts` — Chart support (requires `echarts` peer dependency)
 * - `u-widgets/forms` — Rich formdown parsing (requires `@formdown/core` peer dependency)
 *
 * @example
 * ```ts
 * import 'u-widgets';
 * // import 'u-widgets/charts'; // opt-in chart support
 *
 * const el = document.createElement('u-widget');
 * el.spec = { widget: 'metric', data: { value: 42, unit: 'users' } };
 * document.body.appendChild(el);
 * ```
 */

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
export { suggestWidget } from './core/suggest.js';
export { registerLocale, getLocaleStrings, formatTemplate, getDefaultLocale, setDefaultLocale, getEffectiveLocale, resolveLocale } from './core/locale.js';
export type { UWidgetLocaleStrings } from './core/locale.js';

export type { UWidgetElementProps } from './types/jsx.js';

export { UWidget } from './elements/u-widget.js';
