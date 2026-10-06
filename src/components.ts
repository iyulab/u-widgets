/**
 * @module u-widgets/components
 *
 * Opt-in integration with `@iyulab/components`: `uw-form` draws `date` and `datetime` fields with
 * `<u-date-picker>` instead of the browser's native inputs — the same typed entry and calendar the
 * rest of an `@iyulab/components` app uses, in the app's locale rather than the browser's.
 * Requires `@iyulab/components` (optional peer). Without this import u-widgets stays native and
 * runs without it.
 *
 * u-widgets also follows the `@iyulab/components` locale: its default locale becomes `Locale.get()` and moves with
 * every `Locale.set()`, so one call switches the whole app. A widget's own `locale` still wins.
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
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import { registerFieldControl, type FieldControlContext } from './core/field-controls.js';
import { setDefaultLocale } from './core/locale.js';

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

// One language for the app: u-widgets' default locale is the components locale, now and after every switch.
setDefaultLocale(Locale.get());
Locale.subscribe(() => setDefaultLocale(Locale.get()));
