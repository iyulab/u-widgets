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

/**
 * Splits written text at each `separator` not escaped with a backslash — the formdown option
 * grammar (`\,` and `\=` belong to the option). The pieces keep their escapes.
 */
function splitUnescaped(text: string, separator: string, limit = Infinity): string[] {
  const pieces: string[] = [];
  let piece = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\' && i + 1 < text.length) {
      piece += c + text[++i];
    } else if (c === separator && pieces.length < limit - 1) {
      pieces.push(piece);
      piece = '';
    } else {
      piece += c;
    }
  }
  pieces.push(piece);
  return pieces;
}

const unescape = (text: string): string => text.replace(/\\([\\,=])/g, '$1');

/**
 * Reads a formdown option list (`{hw=Hardware,sw=Software,other}`): `value=Label` keeps a value
 * apart from the text shown for it, split at the first unescaped `=`; anything else is a value
 * shown as written. Same reading as `@formdown/core`'s `parseOptionList`.
 */
export function parseOptionList(written: string): UWidgetFieldOptionInput[] {
  return splitUnescaped(written, ',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [left, right] = splitUnescaped(entry, '=', 2);
      if (right !== undefined) {
        const value = unescape(left.trim());
        const label = unescape(right.trim());
        if (value && label) return value === label ? value : { value, label };
      }
      return unescape(entry);
    });
}
