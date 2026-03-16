/**
 * @module u-widgets/react
 *
 * React wrapper for `<u-widget>` custom element.
 * Uses `@lit/react` to bridge Lit properties and React props.
 *
 * Requires the base package to be imported separately to register the element:
 *
 * @example
 * ```tsx
 * import '@iyulab/u-widgets';             // registers <u-widget>
 * import { UWidget } from '@iyulab/u-widgets/react';
 *
 * function App() {
 *   return (
 *     <UWidget
 *       spec={{ widget: 'metric', data: { value: 42 } }}
 *       onWidgetEvent={(e) => console.log(e.detail)}
 *     />
 *   );
 * }
 * ```
 */
import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { UWidget as UWidgetElement } from '@iyulab/u-widgets';

export const UWidget = createComponent({
  tagName: 'u-widget',
  elementClass: UWidgetElement,
  react: React,
  events: {
    onWidgetEvent: 'u-widget-event' as EventName<CustomEvent>,
  },
});

// Re-export core types for convenience
export type { UWidgetSpec, UWidgetEvent, UWidgetAction } from '@iyulab/u-widgets';
