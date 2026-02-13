// u-widgets/forms — @formdown/core integration entry point.
// Import this to enable rich formdown parsing with @formdown/core.

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
