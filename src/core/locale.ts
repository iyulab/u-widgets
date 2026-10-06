/**
 * Lightweight locale registry for u-widgets.
 *
 * Scope: library-internal chrome strings only (validation messages,
 * pagination labels, ARIA labels). NOT a general i18n framework.
 *
 * English is the built-in default. Consumers register other locales:
 *   registerLocale('ko', { prev: '이전', next: '다음', ... });
 */

export interface UWidgetLocaleStrings {
  // UI chrome — table pagination
  prev: string;
  next: string;
  searchPlaceholder: string;

  // ARIA labels — table
  searchTable: string;
  previousPage: string;
  nextPage: string;
  tablePagination: string;
  dataTable: string;
  /** Appended (visually hidden) to the accessible name of links that open a new tab — citations, markdown links. */
  opensInNewTab: string;

  // Validation messages — form (templates with {label}, {min}, {max})
  required: string;
  minLength: string;
  maxLength: string;
  minValue: string;
  maxValue: string;
  invalidEmail: string;
  invalidUrl: string;
  invalidPattern: string;
  // Accessible names of widget regions (used when the spec has no title)
  actions: string;
  citations: string;
  gallery: string;
  keyValuePairs: string;
  status: string;
  steps: string;
  /** Rating with no label or title — template with {value}, {max}. */
  ratingOutOf: string;
  // Code block
  code: string;
  copy: string;
  copied: string;
  // Fallback cards (a spec the page cannot render) — templates; {import} and {suggestion} render as code/strong
  moduleNotLoaded: string;
  addImportHint: string;
  didYouMean: string;
  invalidSpec: string;
}

const EN: UWidgetLocaleStrings = {
  // UI chrome
  prev: 'Prev',
  next: 'Next',
  searchPlaceholder: 'Search...',

  // ARIA
  searchTable: 'Search table',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  tablePagination: 'Table pagination',
  dataTable: 'Data table',
  opensInNewTab: '(opens in a new tab)',

  // Validation
  required: '{label} is required',
  minLength: '{label} must be at least {min} characters',
  maxLength: '{label} must be at most {max} characters',
  minValue: '{label} must be at least {min}',
  maxValue: '{label} must be at most {max}',
  invalidEmail: '{label} must be a valid email address',
  invalidUrl: '{label} must be a valid URL',
  invalidPattern: '{label} format is invalid',
  // Region names
  actions: 'Actions',
  citations: 'Citations',
  gallery: 'Gallery',
  keyValuePairs: 'Key-value pairs',
  status: 'Status',
  steps: 'Steps',
  ratingOutOf: 'Rating: {value} out of {max}',
  // Code block
  code: 'code',
  copy: 'Copy',
  copied: 'Copied!',
  // Fallback cards
  moduleNotLoaded: 'Widget module not loaded: {widget}',
  addImportHint: 'Add {import} to render this widget.',
  didYouMean: 'Did you mean {suggestion}?',
  invalidSpec: 'Invalid widget spec',
};

const registry = new Map<string, UWidgetLocaleStrings>();

// ── Change notification ──
const listeners = new Set<() => void>();
let revision = 0;
function notify(): void {
  revision++;
  for (const listener of [...listeners]) listener();
}

/**
 * Call `listener` whenever the locale changes — `setDefaultLocale()` to another value, or `registerLocale()`.
 * Returns the unsubscribe function. `<u-widget>` subscribes while connected and re-renders, so a runtime language
 * switch reaches what is already on screen.
 */
export function onLocaleChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** A number that grows on every change — compare it to know whether the locale changed since you last looked. */
export function getLocaleRevision(): number {
  return revision;
}

/**
 * Register a locale for u-widgets chrome strings.
 * Partial overrides are merged with English defaults.
 */
export function registerLocale(
  lang: string,
  strings: Partial<UWidgetLocaleStrings>,
): void {
  registry.set(lang.toLowerCase(), { ...EN, ...strings });
  notify();
}

/**
 * Resolve locale strings for the given language tag.
 *
 * Resolution order:
 *   1. Exact match (e.g. 'ko-KR')
 *   2. Base language (e.g. 'ko')
 *   3. English fallback
 */
export function getLocaleStrings(lang?: string): UWidgetLocaleStrings {
  if (!lang) return EN;

  const key = lang.toLowerCase();
  if (registry.has(key)) return registry.get(key)!;

  // Try base language: 'ko-KR' → 'ko'
  const base = key.split('-')[0];
  if (base !== key && registry.has(base)) return registry.get(base)!;

  return EN;
}

/** The strings for a widget's spec — its `options.locale` (which `<u-widget>` fills from `resolveLocale`). */
export function localeStringsOf(spec?: { options?: Record<string, unknown> } | null): UWidgetLocaleStrings {
  const locale = spec?.options?.locale;
  return getLocaleStrings(typeof locale === 'string' ? locale : undefined);
}

/**
 * Split a template around one `{key}` placeholder — for templates whose placeholder renders as markup
 * (`Add {import} to …` around a `<code>`). A template without it is all `before`.
 */
export function splitTemplate(template: string, key: string): [before: string, after: string] {
  const i = template.indexOf(`{${key}}`);
  return i < 0 ? [template, ''] : [template.slice(0, i), template.slice(i + key.length + 2)];
}

/**
 * Format a template string by replacing {key} placeholders.
 */
export function formatTemplate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] != null ? String(params[key]) : `{${key}}`,
  );
}

/**
 * Get the English defaults (for testing / reference).
 */
export function getDefaultLocale(): UWidgetLocaleStrings {
  return { ...EN };
}

// ── Global default locale ──

let _defaultLocale: string | undefined;

/**
 * Set the global default locale for all u-widgets.
 *
 * Resolution order (highest priority first):
 *   1. Per-widget `locale` attribute/property
 *   2. setDefaultLocale() value
 *   3. document.documentElement.lang (browser only)
 *   4. English fallback
 *
 * @example
 * ```ts
 * import { setDefaultLocale } from '@iyulab/u-widgets';
 * setDefaultLocale('ko-KR');
 * ```
 */
export function setDefaultLocale(lang: string | undefined): void {
  if (lang === _defaultLocale) return;
  _defaultLocale = lang;
  notify();
}

/**
 * Get the active global default locale set via setDefaultLocale().
 * Returns undefined if not set.
 */
export function getEffectiveLocale(): string | undefined {
  return _defaultLocale;
}

/**
 * Resolve the locale to use for a widget.
 *
 * Priority: widgetLocale > setDefaultLocale() > document.lang > undefined
 */
export function resolveLocale(widgetLocale?: string | null): string | undefined {
  if (widgetLocale) return widgetLocale;
  if (_defaultLocale) return _defaultLocale;
  if (typeof document !== 'undefined' && document.documentElement?.lang) {
    return document.documentElement.lang;
  }
  return undefined;
}
