import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';
import katex from 'katex';

/**
 * <uw-math> — LaTeX math expression renderer via KaTeX.
 *
 * Uses MathML output for zero-CSS rendering in Shadow DOM.
 * Loaded via the `u-widgets/math` entry point. Requires `katex` as a peer dependency.
 */
@customElement('uw-math')
export class UwMath extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: uw-math / inline-size;
    }

    .math-block {
      color: var(--u-widget-text, #1a1a2e);
      overflow-x: auto;
      font-size: 1rem;
      line-height: 1.6;
    }

    .math-block[data-display="true"] {
      text-align: center;
      padding: 8px 0;
      font-size: 1.2rem;
    }

    .math-error {
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid var(--u-widget-negative, #dc2626);
      background: color-mix(in srgb, var(--u-widget-negative, #dc2626) 8%, var(--u-widget-bg, #fff));
      font-size: 0.8125rem;
      color: var(--u-widget-negative, #dc2626);
    }

    .math-error code {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--u-widget-text-secondary, #64748b);
      word-break: break-all;
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  render() {
    if (!this.spec) return nothing;

    const data = this.spec.data as Record<string, unknown> | undefined;
    if (!data) return nothing;

    const expression = String(data.expression ?? '').trim();
    if (!expression) return nothing;

    const options = (this.spec.options ?? {}) as Record<string, unknown>;
    const displayMode = Boolean(options.displayMode ?? false);

    try {
      // SAFETY: output must be 'mathml' — pure MathML has no script/event vectors,
      // making .innerHTML safe. Switching to 'html' or 'htmlAndMathml' would require
      // KaTeX CSS and introduce potential XSS via custom macros.
      const rendered = katex.renderToString(expression, {
        displayMode,
        throwOnError: true,
        output: 'mathml',
      });

      return html`
        <div
          class="math-block"
          part="math"
          data-display=${String(displayMode)}
          .innerHTML=${rendered}
        ></div>
      `;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid expression';
      return html`
        <div class="math-error" part="math-error">
          ${msg}
          <code>${expression}</code>
        </div>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-math': UwMath;
  }
}
