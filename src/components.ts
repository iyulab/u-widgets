/**
 * @module u-widgets/components
 *
 * Opt-in integration with `@iyulab/components`: `uw-form` draws `date` and `datetime` fields with
 * `<u-date-picker>` instead of the browser's native inputs — the same typed entry and calendar the
 * rest of an `@iyulab/components` app uses, in the app's locale rather than the browser's. A `format`
 * written as a spreadsheet number-format code (`"#,##0.00"`, `"0.0%"`, `"#,##0;[Red](#,##0)"`) is read with
 * the engine `@iyulab/components` shares with its table and sheet — the same code writes the same text in
 * all three. Without this import such a `format` is shown as the plain value, with a console warning.
 * A table's search box matches as the components select and table filters do — case and diacritics folded, Korean
 * initials (`ㅅㅇ` finds `서울`), and rows narrowing while a Korean syllable is still being typed; without this import it
 * matches the text case-insensitively and waits for the syllable.
 * Requires `@iyulab/components` 2.36 or later (optional peer). Without this import u-widgets stays native and
 * runs without it.
 *
 * u-widgets also follows the `@iyulab/components` locale: its default locale becomes `Locale.get()` and moves with
 * every `Locale.set()`, so one call switches the whole app. A widget's own `locale` still wins.
 *
 * Submitted values keep the native shape: `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm` (local time)
 * for `datetime` — turning this on changes how a field looks, not what the form sends. The picker is a
 * formdown field type (`date`, `datetime-local`), so every `<formdown-ui>` on the page draws it, not only `uw-form`.
 *
 * @example
 * ```ts
 * import '@iyulab/u-widgets';
 * import '@iyulab/u-widgets/components';
 * ```
 */

import '@iyulab/components/dist/components/date-picker/UDatePicker.js';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import { getDefaultExtensionManager, type Field } from '@formdown/core';
import { applyNumberFormat } from '@iyulab/components/dist/utilities/numberFormat.js';
import { setNumberCodeReader } from './core/format.js';
import { setSearchMatcher } from './core/search.js';
import { setDefaultLocale } from './core/locale.js';

const escapeAttr = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** `min`/`max` the picker reads: an ISO day (it bounds days, also in datetime mode). */
function dayBound(bound: unknown): string | undefined {
  return typeof bound === 'string' && /^\d{4}-\d{2}-\d{2}/.test(bound) ? bound.slice(0, 10) : undefined;
}

/** The control `<formdown-ui>` puts under the field's label: a form-associated `<u-date-picker>`, which it binds
 *  by its `name` — the value it reports is read in, `data` is written to it. The id and label are formdown's. */
function datePicker(mode: 'date' | 'datetime') {
  return (field: Field): string => {
    const attributes = (field.attributes ?? {}) as Record<string, unknown>;
    const min = dayBound(attributes.min);
    const max = dayBound(attributes.max);
    const placeholder = field.placeholder ?? (typeof attributes.placeholder === 'string' ? attributes.placeholder : undefined);
    // html-sink: attr — name and placeholder are attribute-escaped (quotes included); min/max are an ISO day by
    // pattern (dayBound) and mode is one of two literals
    return `<u-date-picker id="${escapeAttr(field.name)}" name="${escapeAttr(field.name)}" mode="${mode}"${min ? ` min="${min}"` : ''}${
      max ? ` max="${max}"` : ''
    }${placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : ''}${field.required ? ' required' : ''} part="input"></u-date-picker>`;
  };
}

// Registered on formdown's field type registry at once (`registerPlugin` registers after an await, so a form drawn
// right after this import could miss it). Once per page — a second copy of this module leaves the first in place.
const fieldTypes = getDefaultExtensionManager().getFieldTypeRegistry();
if (!fieldTypes.has('date')) fieldTypes.register({ type: 'date', generator: datePicker('date') });
if (!fieldTypes.has('datetime-local')) fieldTypes.register({ type: 'datetime-local', generator: datePicker('datetime') });

// One number-format vocabulary for the app: a `format` written as a spreadsheet code (`#,##0.00`, `0.0%`) is read by the
// engine the `@iyulab/components` table and sheet read their column `format` with, so one code writes one text everywhere.
setNumberCodeReader((value, code, locale) => applyNumberFormat(value, code, locale));

// One search match for the app: a table's search box finds what the components select and table filters find — case and
// diacritics folded, Korean initials, and a syllable still being composed matched by its keystrokes (the rows narrow while typing).
setSearchMatcher((text, query, options) => Locale.matchesSearch(text, query, options));

// One language for the app: u-widgets' default locale is the components locale, now and after every switch.
setDefaultLocale(Locale.get());
Locale.subscribe(() => setDefaultLocale(Locale.get()));
