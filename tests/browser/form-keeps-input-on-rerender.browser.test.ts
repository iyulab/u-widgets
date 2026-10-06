// A re-render of <u-widget> must not wipe what the user typed into its form.
//
// `u-widget` hands its child a freshly built spec on every render (locale propagation, inferred mapping), and
// `uw-form` reset its data and errors whenever `spec` changed — so any re-render (a theme switch, a locale switch)
// threw away the user's input. Only a new `data` or `fields` from the caller is a new form.
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import '../../src/elements/uw-form.js';

const formIn = (w: Element) => w.shadowRoot!.querySelector('uw-form') as HTMLElement & { updateComplete: Promise<unknown> };
const settle = async (w: HTMLElement & { updateComplete: Promise<unknown> }) => {
  await w.updateComplete; await formIn(w)?.updateComplete; await new Promise((r) => setTimeout(r, 20));
};

describe('uw-form inside u-widget keeps input across re-renders', () => {
  afterEach(() => { document.body.innerHTML = ''; document.documentElement.removeAttribute('lang'); });

  it('typed text survives a theme switch', async () => {
    document.documentElement.lang = 'en';
    const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; theme: string | null; updateComplete: Promise<unknown> };
    w.spec = { widget: 'form', data: { name: '' }, fields: [{ field: 'name', type: 'text', label: 'Name' }] };
    document.body.appendChild(w);
    await settle(w);
    const input = formIn(w).shadowRoot!.querySelector('input')!;
    input.value = 'Ann';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await settle(w);
    w.theme = 'dark';
    await settle(w);
    expect(formIn(w).shadowRoot!.querySelector('input')!.value).toBe('Ann');
  });

  it('NEGATIVE — a new spec from the caller is a new form', async () => {
    const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    w.spec = { widget: 'form', data: { name: '' }, fields: [{ field: 'name', type: 'text', label: 'Name' }] };
    document.body.appendChild(w);
    await settle(w);
    const input = formIn(w).shadowRoot!.querySelector('input')!;
    input.value = 'Ann';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    w.spec = { widget: 'form', data: { name: 'Bo' }, fields: [{ field: 'name', type: 'text', label: 'Name' }] };
    await settle(w);
    expect(formIn(w).shadowRoot!.querySelector('input')!.value).toBe('Bo');
  });
});
