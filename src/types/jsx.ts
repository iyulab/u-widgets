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
  /** Theme override. Omit for color-scheme auto-detection. */
  theme?: 'light' | 'dark';
  /** BCP 47 locale tag, e.g. 'ko-KR'. */
  locale?: string;
  id?: string;
  class?: string;
  style?: string;
  [key: string]: unknown;
}

declare global {
  // The tag map entry lives with the class (elements/u-widget.ts).
  // JSX.IntrinsicElements 전역 증강은 namespace 선언만 가능 (ES module 문법 대체 불가)
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'u-widget': UWidgetElementProps;
    }
  }
}

// `@types/react` 19 dropped the global `JSX` namespace; the automatic runtime reads `React.JSX`.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'u-widget': UWidgetElementProps;
    }
  }
}
