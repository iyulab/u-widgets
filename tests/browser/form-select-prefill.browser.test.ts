// A pre-filled select shows its value on first render — in a real browser.
//
// Lit commits a `<select>`'s own bindings before its child `<option>`s, so `.value` set on the
// first render names an option that does not exist yet: the select showed "--" with the value
// lost (Chromium). happy-dom resolves selectedness differently, which is why this lives here.
import { describe, it, expect } from 'vitest';
import '../../src/elements/uw-form.js';
import type { UwForm } from '../../src/elements/uw-form.js';

describe('uw-form select', () => {
  it('shows the pre-filled value on first render — plain and { value, label } options', async () => {
    const el = document.createElement('uw-form') as UwForm;
    el.spec = {
      widget: 'form',
      data: { size: 'M', kind: 'hw' },
      fields: [
        { field: 'size', type: 'select', options: ['S', 'M', 'L'] },
        { field: 'kind', type: 'select', options: [{ value: 'sw', label: 'Software' }, { value: 'hw', label: 'Hardware' }] },
      ],
    } as UwForm['spec'];
    document.body.appendChild(el);
    await el.updateComplete;
    const [size, kind] = el.shadowRoot!.querySelectorAll('select');
    expect(size.value).toBe('M');
    expect(kind.value).toBe('hw');
    expect(kind.selectedOptions[0]?.textContent?.trim()).toBe('Hardware');
    el.remove();
  });
});
