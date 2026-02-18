/**
 * @module u-widgets/forms
 *
 * Integration entry point for `@formdown/core`. Import this module to replace
 * the built-in formdown parser with the full `@formdown/core` parser, enabling
 * richer form syntax support.
 *
 * @example
 * ```ts
 * import 'u-widgets';
 * import 'u-widgets/forms';
 *
 * el.spec = { widget: 'form', formdown: '@name*(Name): []\\n@email: @[]' };
 * ```
 */

import { FormManager } from '@formdown/core/form-manager';
import { registerFormdownParser } from './core/formdown.js';
import { mapFields, mapActions } from './adapters/formdown-adapter.js';
import type { FormdownResult } from './core/formdown.js';

function parseWithFormdownCore(input: string, data?: Record<string, unknown>): FormdownResult {
  const fm = new FormManager();
  fm.parse(input);
  if (data) fm.setDefaults(data);
  return {
    fields: mapFields(fm.getInputFields()),
    actions: mapActions(fm.getActions()),
  };
}

registerFormdownParser(parseWithFormdownCore);

export { mapFields, mapActions } from './adapters/formdown-adapter.js';
