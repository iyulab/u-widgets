/**
 * How a table orders two texts. Without a comparer: digit runs inside text compare as numbers (`A-2` before `A-10`), case and
 * diacritics compare as the same letter (equal rows keep their order), and the locale is the widget's own — then the app's default
 * (`setDefaultLocale`), then the page's `lang`; never the browser's language.
 */
export type TextComparer = (a: string, b: string, locale?: string) => number;

let comparer: TextComparer | undefined;
const collators = new Map<string, Intl.Collator>();

/**
 * Turn on the `@iyulab/components` text order — what `@iyulab/u-widgets/components` does by importing it, so a table here orders
 * its rows as the components tables do.
 */
export function setTextComparer(next: TextComparer | undefined): void {
  comparer = next;
}

function collatorFor(locale: string | undefined): Intl.Collator {
  const key = locale ?? '';
  let collator = collators.get(key);
  if (!collator) {
    const options: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };
    try {
      collator = new Intl.Collator(locale || 'en', options); // compare-ok: the native default; `@iyulab/components` is an optional peer, so the core cannot import its order
    } catch {
      // A malformed tag (`ko_KR`) compares as English rather than throwing in the middle of a sort.
      collator = new Intl.Collator('en', options); // compare-ok: the same default, English fallback for a malformed tag
    }
    collators.set(key, collator);
  }
  return collator;
}

/** Negative, zero or positive: `a` before, level with, or after `b`. `locale` is the widget's resolved locale, when it has one. */
export function compareText(a: string, b: string, locale?: string): number {
  if (comparer) return comparer(a, b, locale);
  return collatorFor(locale).compare(a, b);
}
