// `u-widgets/components` — an app that opts in gets `<u-date-picker>` for date and datetime
// fields, and the form keeps sending what the native inputs sent.
import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/elements/uw-form.js';
import '../../src/components.js';
import type { UwForm } from '../../src/elements/uw-form.js';

type Picker = HTMLElement & { value: string; mode: string };

async function mount(data: Record<string, unknown>) {
  const el = document.createElement('uw-form') as UwForm;
  el.spec = {
    widget: 'form',
    data,
    fields: [
      { field: 'due', label: 'Due', type: 'date', min: '2026-01-01' },
      { field: 'at', label: 'At', type: 'datetime' },
    ],
  } as UwForm['spec'];
  document.body.appendChild(el);
  await el.updateComplete;
  const changes: unknown[] = [];
  el.addEventListener('u-widget-internal', (e) => changes.push((e as CustomEvent).detail.data));
  const [due, at] = el.shadowRoot!.querySelectorAll('u-date-picker') as NodeListOf<Picker>;
  await (due as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return { el, due, at, changes };
}

describe('uw-form with u-widgets/components', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('draws date and datetime fields with u-date-picker, pre-filled, labelled by the field label', async () => {
    const { el, due, at } = await mount({ due: '2026-10-06', at: '2026-10-06T14:30' });
    expect(el.shadowRoot!.querySelector('input[type="date"], input[type="datetime-local"]')).toBeNull();
    expect([due.mode, due.value]).toEqual(['date', '2026-10-06']);
    expect([at.mode, at.value]).toEqual(['datetime', '2026-10-06T14:30']);
    expect((due as unknown as { min?: string }).min).toBe('2026-01-01');
    const label = el.shadowRoot!.querySelector('label[for="input-due"]') as HTMLLabelElement;
    expect(label.control).toBe(due);
  });

  it('a typed date reaches the form as YYYY-MM-DD', async () => {
    const { due, changes } = await mount({});
    const box = due.shadowRoot!.querySelector('input') as HTMLInputElement;
    await userEvent.click(box);
    await userEvent.type(box, '2026-10-08');
    await userEvent.keyboard('{Enter}');
    expect(changes).toContainEqual({ field: 'due', value: '2026-10-08' });
  });

  it('a datetime reaches the form in the native datetime-local shape (local wall time)', async () => {
    const { at, changes } = await mount({});
    at.value = '2026-10-07T09:15:00+09:00';
    at.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(changes).toEqual([{ field: 'at', value: '2026-10-07T09:15' }]);
  });
});
