// A suggestion for a field with options, as a person meets it: the option's label on the button, which one the field
// holds now (`aria-pressed`), the buttons a group named for the field — and the pick reports the value.
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/uw-form.js';
import type { UwForm } from '../../src/elements/uw-form.js';

type Updating = HTMLElement & { updateComplete: Promise<unknown> };

async function mount(spec: Record<string, unknown>) {
  const el = document.createElement('uw-form') as UwForm;
  el.spec = spec as unknown as UwForm['spec'];
  document.body.appendChild(el);
  await el.updateComplete;
  const fields = el.shadowRoot!.querySelector('formdown-ui') as Updating;
  await fields.updateComplete;
  await new Promise((r) => setTimeout(r, 20));
  return { el, root: fields.shadowRoot! };
}

describe('uw-form suggestions for a field with options', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('show the option’s label, say whether it is the value, and report the value', async () => {
    const { el, root } = await mount({
      widget: 'form',
      data: { kind: 'sw' },
      fields: [{ field: 'kind', label: 'Kind', type: 'select', options: [{ value: 'hw', label: 'Hardware' }, { value: 'sw', label: 'Software' }] }],
      fieldStates: { kind: { suggestions: ['hw', 'sw'] } },
    });
    const picks: unknown[] = [];
    el.addEventListener('u-widget-internal', (e) => {
      const { type, data } = (e as CustomEvent).detail;
      if (type === 'suggestion-pick') picks.push(data);
    });
    const buttons = Array.from(root.querySelectorAll('[part~="suggestion"]')) as HTMLButtonElement[];
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Hardware', 'false'], ['Software', 'true']]);
    expect(buttons[0].closest('[role="group"]')?.getAttribute('aria-label')).toContain('Kind');
    buttons[0].click();
    expect(picks).toEqual([{ field: 'kind', value: 'hw' }]);
    await new Promise((r) => setTimeout(r, 20));
    expect((root.querySelector('select[name="kind"]') as HTMLSelectElement).value).toBe('hw');
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
  });
});
