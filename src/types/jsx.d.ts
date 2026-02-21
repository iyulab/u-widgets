/**
 * JSX type declarations for <u-widget> custom element.
 *
 * Covers React (global JSX namespace used by React 19+),
 * Preact, SolidJS, and any framework using the standard JSX namespace.
 */
import type { UWidgetSpec } from '../core/types.js';

export interface UWidgetElementProps {
  /** Widget spec — object (via property binding) or JSON string (via attribute). */
  spec?: UWidgetSpec | string;
  /** Theme override. Omit for prefers-color-scheme auto-detection. */
  theme?: 'light' | 'dark';
  /** BCP 47 locale tag, e.g. 'ko-KR'. */
  locale?: string;
  id?: string;
  class?: string;
  style?: string;
  [key: string]: unknown;
}

declare global {
  interface HTMLElementTagNameMap {
    'u-widget': import('../elements/u-widget.js').UWidget;
  }

  namespace JSX {
    interface IntrinsicElements {
      'u-widget': UWidgetElementProps;
    }
  }
}
