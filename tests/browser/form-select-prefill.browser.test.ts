// A pre-filled select shows its value on first render — in a real browser.
//
// The value arrives with the spec while the fields are still being drawn; a select whose options do not exist yet
// when its value is set shows nothing chosen (Chromium). happy-dom resolves selectedness differently, which is why
// this lives here.
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
    const fields = el.shadowRoot!.querySelector('formdown-ui') as HTMLElement & { updateComplete: Promise<unknown> };
    await fields.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    const [size, kind] = fields.shadowRoot!.querySelectorAll('select');
    expect(size.value).toBe('M');
    expect(kind.value).toBe('hw');
    expect(kind.selectedOptions[0]?.textContent?.trim()).toBe('Hardware');
    el.remove();
  });
});
