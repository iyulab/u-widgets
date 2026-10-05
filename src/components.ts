/**
 * @module u-widgets/components
 *
 * Opt-in integration with `@iyulab/components`: `uw-form` draws `date` and `datetime` fields with
 * `<u-date-picker>` instead of the browser's native inputs — the same typed entry and calendar the
 * rest of an `@iyulab/components` app uses, in the app's locale rather than the browser's.
 * Requires `@iyulab/components` (optional peer). Without this import u-widgets stays native and
 * runs without it.
 *
 * Submitted values keep the native shape: `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm` (local time)
 * for `datetime` — turning this on changes how a field looks, not what the form sends.
 *
 * @example
 * ```ts
 * import '@iyulab/u-widgets';
 * import '@iyulab/u-widgets/components';
 * ```
 */

import { html, nothing } from 'lit';
import '@iyulab/components/dist/components/date-picker/UDatePicker.js';
import { registerFieldControl, type FieldControlContext } from './core/field-controls.js';

/** `min`/`max` the picker reads: an ISO day (it bounds days, also in datetime mode). */
function dayBound(bound: number | string | undefined): string | undefined {
  return typeof bound === 'string' && /^\d{4}-\d{2}-\d{2}/.test(bound) ? bound.slice(0, 10) : undefined;
}

function datePicker(mode: 'date' | 'datetime') {
  return ({ field, value, id, hasError, errorId, onChange }: FieldControlContext) => html`<u-date-picker
    id=${id}
    mode=${mode}
    .value=${typeof value === 'string' ? value : ''}
    .min=${dayBound(field.min)}
    .max=${dayBound(field.max)}
    placeholder=${field.placeholder ?? nothing}
    ?required=${field.required}
    aria-invalid=${hasError ? 'true' : 'false'}
    aria-describedby=${errorId ?? nothing}
    @change=${(e: Event) => {
      const picked = (e.target as HTMLElement & { value: string }).value ?? '';
      // The picker emits a full DateTimeOffset in datetime mode; its local wall time is what a
      // native `datetime-local` would have sent.
      onChange(mode === 'datetime' ? picked.slice(0, 16) : picked);
    }}
    part="input"
  ></u-date-picker>`;
}

registerFieldControl('date', datePicker('date'));
registerFieldControl('datetime', datePicker('datetime'));
