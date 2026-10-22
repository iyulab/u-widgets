// The fields `<formdown-ui>` draws inside the form look like the widget's — in a real browser.
//
// The widget sets the fields' look through `<formdown-ui>`'s custom properties from its own tokens; whether a token
// reaches an input two shadow roots down is the cascade's answer, which happy-dom does not give. Same for an error:
// it has to show, in the widget's negative color, beside a field marked invalid.
import { describe, it, expect, afterEach } from 'vitest';
import { whenFormdownLoaded } from '../../src/elements/uw-form.js';
import type { UwForm } from '../../src/elements/uw-form.js';

type Updating = HTMLElement & { updateComplete: Promise<unknown> };

async function mount(spec: Record<string, unknown>, style = ''): Promise<{ el: UwForm; root: ShadowRoot }> {
  const el = document.createElement('uw-form') as UwForm;
  if (style) el.setAttribute('style', style);
  el.spec = spec as unknown as UwForm['spec'];
  document.body.appendChild(el);
  // <formdown-ui> loads with the first form drawn; run alone, this file draws that first form.
  await whenFormdownLoaded();
  await el.updateComplete;
  const fields = el.shadowRoot!.querySelector('formdown-ui') as Updating;
  await fields.updateComplete;
  await new Promise((r) => setTimeout(r, 20));
  return { el, root: fields.shadowRoot! };
}

describe('uw-form fields look like the widget', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('a theme token on the widget reaches the drawn input', async () => {
    const { root } = await mount(
      { widget: 'form', fields: [{ field: 'name', label: 'Name' }] },
      '--u-widget-border: rgb(1, 2, 3); --u-widget-text: rgb(4, 5, 6)',
    );
    const input = root.querySelector('input[name="name"]')!;
    expect(getComputedStyle(input).borderTopColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(input).color).toBe('rgb(4, 5, 6)');
  });

  it('a failed submit shows the error beside the field, in the negative color', async () => {
    const { el, root } = await mount(
      {
        widget: 'form',
        fields: [{ field: 'name', label: 'Name', required: true }],
        actions: [{ label: 'Save', action: 'submit' }],
      },
      '--u-widget-negative: rgb(200, 0, 0)',
    );
    (el.shadowRoot!.querySelector('.actions button') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 20));
    const input = root.querySelector('input[name="name"]')!;
    const error = root.querySelector('[part~="field-error"]') as HTMLElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
    expect(error.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(getComputedStyle(error).color).toBe('rgb(200, 0, 0)');
    expect(root.activeElement).toBe(input);
  });

  it('a page styles a field through the widget’s parts', async () => {
    const sheet = document.createElement('style');
    sheet.textContent = 'uw-form::part(label) { letter-spacing: 3px; }';
    document.head.appendChild(sheet);
    try {
      const { root } = await mount({ widget: 'form', fields: [{ field: 'name', label: 'Name' }] });
      expect(getComputedStyle(root.querySelector('label')!).letterSpacing).toBe('3px');
    } finally {
      sheet.remove();
    }
  });
});
