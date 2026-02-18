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

  // Validation messages — form (templates with {label}, {min}, {max})
  required: string;
  maxLength: string;
  minValue: string;
  maxValue: string;
  invalidEmail: string;
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

  // Validation
  required: '{label} is required',
  maxLength: '{label} must be at most {max} characters',
  minValue: '{label} must be at least {min}',
  maxValue: '{label} must be at most {max}',
  invalidEmail: '{label} must be a valid email address',
};

const registry = new Map<string, UWidgetLocaleStrings>();

/**
 * Register a locale for u-widgets chrome strings.
 * Partial overrides are merged with English defaults.
 */
export function registerLocale(
  lang: string,
  strings: Partial<UWidgetLocaleStrings>,
): void {
  registry.set(lang.toLowerCase(), { ...EN, ...strings });
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
