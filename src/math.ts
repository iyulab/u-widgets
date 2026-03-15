/**
 * @module u-widgets/math
 *
 * Separate entry point for math expression support. Import this module to enable
 * the `math` widget type in `<u-widget>`. Requires `katex` as a peer dependency.
 *
 * @example
 * ```ts
 * import 'u-widgets';
 * import 'u-widgets/math';
 *
 * el.spec = { widget: 'math', data: { expression: 'E = mc^2' } };
 * ```
 */

export { UwMath } from './elements/uw-math.js';
