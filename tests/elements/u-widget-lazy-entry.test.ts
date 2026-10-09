import { describe, it, expect, vi } from 'vitest';
import '../../src/elements/u-widget.js';

/**
 * A host that imports an entry point lazily renders its first widgets before the entry registers.
 * That is the documented way to keep a heavy entry (charts) off the critical path, so it must not
 * be reported as a forgotten import. A file of its own: it registers a stand-in `uw-math`, which
 * would otherwise leak into the other tests' missing-entry cases.
 */
describe('u-widget — an entry point that arrives late', () => {
  it('says nothing when the entry registers within the grace, and draws the widget', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    try {
      const el = document.createElement('u-widget') as HTMLElement & {
        spec: unknown;
        updateComplete: Promise<unknown>;
      };
      el.spec = { widget: 'math', data: { expression: 'E = mc^2' } };
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('[data-missing-entry]')).not.toBeNull();

      // The lazily imported entry arrives.
      customElements.define('uw-math', class extends HTMLElement {});
      await customElements.whenDefined('uw-math');
      await vi.advanceTimersByTimeAsync(5000);
      await el.updateComplete;

      expect(el.shadowRoot!.querySelector('uw-math')).not.toBeNull();
      expect(warn.mock.calls.map((c) => String(c[0])).filter((l) => l.includes('needs import'))).toEqual([]);
    } finally {
      vi.useRealTimers();
      warn.mockRestore();
    }
  });
});
