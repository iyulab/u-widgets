import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/uw-form.js';
import type { UwForm } from '../../src/elements/uw-form.js';
import { registerLocale } from '../../src/core/locale.js';
import { toFormdown } from '../../src/core/formdown.js';

// The fields are drawn by `<formdown-ui>`, which has a shadow root of its own — `fields(el)` is where they are.
// What `<formdown-ui>` itself does with a field (how each type draws, which rule says what) is formdown's to test;
// these tests hold what the widget adds: the fields it writes, its events, its actions, its locale and its look.

function createElement(spec: Record<string, unknown>): UwForm {
  const el = document.createElement('uw-form') as UwForm;
  el.spec = spec as unknown as UwForm['spec'];
  document.body.appendChild(el);
  return el;
}

type FieldsElement = HTMLElement & {
  updateComplete: Promise<unknown>;
  data: Record<string, unknown>;
  messages: Record<string, string>;
  fieldStates: Record<string, unknown>;
  content: string;
};

/** Waits for the widget and the fields it draws. */
async function render(el: UwForm): Promise<ShadowRoot> {
  await el.updateComplete;
  const fd = el.shadowRoot!.querySelector('formdown-ui') as FieldsElement | null;
  if (fd) {
    await fd.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el.shadowRoot!;
}

function fieldsOf(el: UwForm): FieldsElement {
  return el.shadowRoot!.querySelector('formdown-ui') as FieldsElement;
}

function fields(el: UwForm): ShadowRoot {
  return fieldsOf(el).shadowRoot!;
}

function type(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function events(el: UwForm) {
  const listener = vi.fn();
  el.addEventListener('u-widget-internal', listener);
  return {
    listener,
    of: (t: string) => listener.mock.calls.map((c) => c[0].detail).filter((d) => d.type === t),
  };
}

function submitButton(el: UwForm): HTMLButtonElement {
  return el.shadowRoot!.querySelector('.actions button') as HTMLButtonElement;
}

describe('toFormdown', () => {
  it('writes each field type as formdown reads it back', () => {
    const text = toFormdown([
      { field: 'title', label: 'Heading', type: 'text', required: true, placeholder: 'Short', pattern: '\\d{3}', minLength: 2, maxLength: 9 },
      { field: 'n', type: 'number', min: 1, max: 10, step: 2 },
      { field: 'body', type: 'textarea', rows: 5 },
      { field: 'tags', type: 'multiselect', options: ['a', { value: 'b', label: 'Bee' }] },
      { field: 'on', type: 'toggle', label: 'Power' },
      { field: 'at', type: 'datetime' },
      { field: 'kind', type: 'radio', options: ['x', 'y'] },
    ]);
    expect(text).toContain('@title(Heading): [text required');
    expect(text).toMatch(/minlength=2/);
    expect(text).toMatch(/maxlength=9/);
    expect(text).toContain('@n: [number');
    expect(text).toMatch(/min=1 max=10 step=2/);
    expect(text).toMatch(/@body: \[textarea rows=5\]/);
    expect(text).toMatch(/@tags: \[select options="a,b=Bee" multiple\]/);
    expect(text).toContain('@on(Power): [checkbox switch]');
    expect(text).toContain('@at: [datetime-local]');
    expect(text).toContain('@kind: [radio options="x,y"]');
  });

  it('writes a field’s own message as its error sentence', () => {
    expect(toFormdown([{ field: 'a', type: 'text', required: true, message: 'Fill it' }])).toContain('error-message="Fill it"');
  });
});

describe('uw-form', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('form widget', () => {
    it('draws the fields with <formdown-ui> from the spec’s fields', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
          { field: 'desc', type: 'textarea', rows: 5 },
          { field: 'priority', type: 'select', options: ['low', 'high'] },
        ],
      });
      await render(el);
      const root = fields(el);
      expect(root.querySelector('label')?.textContent).toContain('Name');
      expect(root.querySelector('input[name="name"]')?.hasAttribute('required')).toBe(true);
      expect(root.querySelector('textarea[name="desc"]')?.getAttribute('rows')).toBe('5');
      expect(root.querySelectorAll('select[name="priority"] option[value="low"], select[name="priority"] option[value="high"]').length).toBe(2);
    });

    it('draws HTML in a label as text', async () => {
      const el = createElement({ widget: 'form', fields: [{ field: 'a', label: '<img src=x onerror=alert(1)>' }] });
      await render(el);
      expect(fields(el).querySelector('img')).toBeNull();
    });

    it('fills the fields from data', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Ada', on: true, tags: ['b'] },
        fields: [
          { field: 'name', type: 'text' },
          { field: 'on', type: 'toggle' },
          { field: 'tags', type: 'multiselect', options: ['a', 'b'] },
        ],
      });
      await render(el);
      const root = fields(el);
      expect((root.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Ada');
      expect((root.querySelector('input[name="on"]') as HTMLInputElement).checked).toBe(true);
      const options = Array.from((root.querySelector('select[name="tags"]') as HTMLSelectElement).options);
      expect(options.filter((o) => o.selected).map((o) => o.value)).toEqual(['b']);
    });

    it('reports a change with the field and its value — a number field’s value as a number', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text' }, { field: 'n', type: 'number' }, { field: 'r', type: 'range', min: 0, max: 10 }],
      });
      await render(el);
      const { of } = events(el);
      type(fields(el).querySelector('input[name="name"]') as HTMLInputElement, 'Ada');
      type(fields(el).querySelector('input[name="n"]') as HTMLInputElement, '42');
      type(fields(el).querySelector('input[name="r"]') as HTMLInputElement, '3');
      expect(of('change').map((d) => d.data)).toEqual([
        { field: 'name', value: 'Ada' },
        { field: 'n', value: 42 },
        { field: 'r', value: 3 },
      ]);
    });

    it('keeps <formdown-ui>’s own events inside the widget', async () => {
      const el = createElement({ widget: 'form', fields: [{ field: 'name', type: 'text' }] });
      await render(el);
      const outside = vi.fn();
      document.body.addEventListener('formdown-change', outside);
      document.body.addEventListener('formdown-data-update', outside);
      type(fields(el).querySelector('input[name="name"]') as HTMLInputElement, 'Ada');
      document.body.removeEventListener('formdown-change', outside);
      document.body.removeEventListener('formdown-data-update', outside);
      expect(outside).not.toHaveBeenCalled();
    });

    it('a new spec object with the same fields and data keeps what the user typed', async () => {
      const spec = { widget: 'form', data: {}, fields: [{ field: 'name', type: 'text' }] };
      const el = createElement(spec);
      await render(el);
      type(fields(el).querySelector('input[name="name"]') as HTMLInputElement, 'typed');
      el.spec = { ...spec, options: { locale: 'ko' } } as unknown as UwForm['spec'];
      await render(el);
      expect((fields(el).querySelector('input[name="name"]') as HTMLInputElement).value).toBe('typed');
    });

    it('new data fills the form again', async () => {
      const spec = { widget: 'form', data: { name: 'one' }, fields: [{ field: 'name', type: 'text' }] };
      const el = createElement(spec);
      await render(el);
      el.spec = { ...spec, data: { name: 'two' } } as unknown as UwForm['spec'];
      await render(el);
      expect((fields(el).querySelector('input[name="name"]') as HTMLInputElement).value).toBe('two');
    });

    it('new fields draw the new form, filled from data', async () => {
      const spec = { widget: 'form', data: { b: 'kept' }, fields: [{ field: 'a', type: 'text' }] };
      const el = createElement(spec);
      await render(el);
      el.spec = { ...spec, fields: [{ field: 'b', type: 'text' }] } as unknown as UwForm['spec'];
      await render(el);
      expect(fields(el).querySelector('input[name="a"]')).toBeNull();
      expect((fields(el).querySelector('input[name="b"]') as HTMLInputElement).value).toBe('kept');
    });
  });

  describe('actions', () => {
    it('submits the values — the spec’s data with the fields, numbers as numbers', async () => {
      const el = createElement({
        widget: 'form',
        data: { id: 7, name: 'Ada' },
        fields: [{ field: 'name', type: 'text' }, { field: 'n', type: 'number' }],
        actions: [{ label: 'Save', action: 'submit', style: 'primary' }],
      });
      await render(el);
      const { of } = events(el);
      type(fields(el).querySelector('input[name="n"]') as HTMLInputElement, '5');
      submitButton(el).click();
      expect(of('submit')).toHaveLength(1);
      expect(of('submit')[0].data).toEqual({ id: 7, name: 'Ada', n: 5 });
    });

    it('does not submit while a field breaks a rule; the field says why and takes focus', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'ok', type: 'text' },
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Save', action: 'submit' }],
      });
      await render(el);
      const { of } = events(el);
      submitButton(el).click();
      await render(el);
      expect(of('submit')).toHaveLength(0);
      const input = fields(el).querySelector('input[name="name"]') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(fields(el).querySelector('[part~="field-error"]')?.textContent).toBe('Name is required');
      expect(fields(el).activeElement).toBe(input);
    });

    it('checks every rule the field declares — length, range, format, pattern', async () => {
      const el = createElement({
        widget: 'form',
        data: { t: 'too long text', n: 50, e: 'nope', p: '1234' },
        fields: [
          { field: 't', label: 'T', type: 'text', maxLength: 5 },
          { field: 'n', label: 'N', type: 'number', max: 10 },
          { field: 'e', label: 'E', type: 'email' },
          { field: 'p', label: 'P', type: 'text', pattern: '\\d{3}' },
        ],
        actions: [{ label: 'Save', action: 'submit' }],
      });
      await render(el);
      const { of } = events(el);
      submitButton(el).click();
      await render(el);
      expect(of('submit')).toHaveLength(0);
      const errors = Array.from(fields(el).querySelectorAll('[part~="field-error"]')).map((e) => e.textContent);
      expect(errors).toEqual([
        'T must be at most 5 characters',
        'N must be at most 10',
        'E must be a valid email address',
        'P format is invalid',
      ]);
    });

    it('submits once the field is fixed', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text', required: true }],
        actions: [{ label: 'Save', action: 'submit' }],
      });
      await render(el);
      const { of } = events(el);
      submitButton(el).click();
      type(fields(el).querySelector('input[name="name"]') as HTMLInputElement, 'Ada');
      submitButton(el).click();
      expect(of('submit').map((d) => d.data)).toEqual([{ name: 'Ada' }]);
    });

    it('a field’s own message says why it is required', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text', required: true, message: 'Tell us your name' }],
        actions: [{ label: 'Save', action: 'submit' }],
      });
      await render(el);
      submitButton(el).click();
      await render(el);
      expect(fields(el).querySelector('[part~="field-error"]')?.textContent).toBe('Tell us your name');
    });

    it('a custom action reports the values; cancel reports only itself', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Ada' },
        fields: [{ field: 'name', type: 'text', required: true }],
        actions: [{ label: 'Draft', action: 'draft' }, { label: 'Cancel', action: 'cancel' }],
      });
      await render(el);
      const { of } = events(el);
      const [draft, cancel] = Array.from(el.shadowRoot!.querySelectorAll('.actions button')) as HTMLButtonElement[];
      draft.click();
      cancel.click();
      expect(of('action')).toEqual([
        expect.objectContaining({ action: 'draft', data: { name: 'Ada' } }),
        expect.objectContaining({ action: 'cancel' }),
      ]);
      expect(of('action')[1].data).toBeUndefined();
    });

    it('draws the actions with their style and disabled state', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'a' }],
        actions: [{ label: 'Delete', action: 'remove', style: 'danger', disabled: true }],
      });
      await render(el);
      const btn = submitButton(el);
      expect(btn.dataset.style).toBe('danger');
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute('part')).toBe('action-btn');
    });
  });

  describe('locale', () => {
    it('says the rules in the widget’s locale', async () => {
      registerLocale('xx', { required: '{label} — needed', maxLength: '{label}: {max} at most' });
      const el = createElement({
        widget: 'form',
        data: { b: 'abcdef' },
        options: { locale: 'xx' },
        fields: [{ field: 'a', label: 'A', required: true }, { field: 'b', label: 'B', maxLength: 3 }],
        actions: [{ label: 'Save', action: 'submit' }],
      });
      await render(el);
      submitButton(el).click();
      await render(el);
      const errors = Array.from(fields(el).querySelectorAll('[part~="field-error"]')).map((e) => e.textContent);
      expect(errors).toEqual(['A — needed', 'B: 3 at most']);
    });

    it('gives <formdown-ui> a sentence for every rule it checks', async () => {
      const el = createElement({ widget: 'form', fields: [{ field: 'a' }] });
      await render(el);
      expect(Object.keys(fieldsOf(el).messages).sort()).toEqual(
        ['date', 'dateMax', 'dateMin', 'email', 'max', 'maxLength', 'min', 'minLength', 'number', 'pattern', 'required', 'tel', 'url'],
      );
      expect(Object.values(fieldsOf(el).messages).every((m) => typeof m === 'string' && m.length > 0)).toBe(true);
    });

    it('rewrites the sentences on screen when the locale changes', async () => {
      registerLocale('yy', { required: '{label} (yy)' });
      const spec = { widget: 'form', data: {}, fields: [{ field: 'a', label: 'A', required: true }], actions: [{ label: 'Save', action: 'submit' }] };
      const el = createElement(spec);
      await render(el);
      submitButton(el).click();
      await render(el);
      el.spec = { ...spec, options: { locale: 'yy' } } as unknown as UwForm['spec'];
      await render(el);
      expect(fields(el).querySelector('[part~="field-error"]')?.textContent).toBe('A (yy)');
    });
  });

  describe('fieldStates — suggestions', () => {
    const spec = (extra: Record<string, unknown> = {}) => ({
      widget: 'form',
      data: {},
      fields: [
        { field: 'title', label: 'Title', type: 'text' },
        { field: 'n', type: 'number' },
        { field: 'tags', type: 'multiselect', options: ['a', 'b', 'c'] },
      ],
      fieldStates: {
        title: { suggestions: ['Pump 3', 'Pump 4'], note: 'From the last report', decline: 'None of these' },
        n: { suggestions: ['12'] },
        tags: { suggestions: ['b'] },
      },
      ...extra,
    });

    it('passes the field states to <formdown-ui>, which lists them under the field', async () => {
      const el = createElement(spec());
      await render(el);
      const root = fields(el);
      expect(Array.from(root.querySelectorAll('[part~="suggestion"]')).map((b) => b.textContent)).toContain('Pump 3');
      expect(root.querySelector('[part~="field-note"]')?.textContent).toContain('From the last report');
      expect(root.querySelector('[part~="decline"]')?.textContent).toBe('None of these');
    });

    it('picking a suggestion puts it in the field, then reports the pick and the change', async () => {
      const el = createElement(spec());
      await render(el);
      const { of, listener } = events(el);
      (fields(el).querySelector('[part~="suggestion"]') as HTMLButtonElement).click();
      await render(el);
      expect((fields(el).querySelector('input[name="title"]') as HTMLInputElement).value).toBe('Pump 3');
      expect(listener.mock.calls.map((c) => c[0].detail.type)).toEqual(['suggestion-pick', 'change']);
      expect(of('suggestion-pick')[0].data).toEqual({ field: 'title', value: 'Pump 3' });
    });

    it('a number field’s suggestion is picked as a number', async () => {
      const el = createElement(spec());
      await render(el);
      const { of } = events(el);
      const n = Array.from(fields(el).querySelectorAll('[part~="suggestion"]')).find((b) => b.textContent === '12') as HTMLButtonElement;
      n.click();
      expect(of('suggestion-pick')[0].data).toEqual({ field: 'n', value: 12 });
      expect(of('change')[0].data).toEqual({ field: 'n', value: 12 });
    });

    it('a pick adds one choice to a multiselect', async () => {
      const el = createElement(spec({ data: { tags: ['a'] } }));
      await render(el);
      const { of } = events(el);
      const b = Array.from(fields(el).querySelectorAll('[part~="suggestion"]')).find((x) => x.textContent === 'b') as HTMLButtonElement;
      b.click();
      expect(of('suggestion-pick')[0].data).toEqual({ field: 'tags', value: 'b' });
      expect(of('change')[0].data).toEqual({ field: 'tags', value: ['a', 'b'] });
    });

    it('declining reports it and changes nothing', async () => {
      const el = createElement(spec());
      await render(el);
      const { of } = events(el);
      (fields(el).querySelector('[part~="decline"]') as HTMLButtonElement).click();
      expect(of('suggestion-decline')).toEqual([expect.objectContaining({ data: { field: 'title' } })]);
      expect(of('change')).toHaveLength(0);
    });

    it('a new fieldStates keeps what the user typed', async () => {
      const s = spec();
      const el = createElement(s);
      await render(el);
      type(fields(el).querySelector('input[name="title"]') as HTMLInputElement, 'typed');
      el.spec = { ...s, fieldStates: { title: { suggestions: ['Other'] } } } as unknown as UwForm['spec'];
      await render(el);
      expect((fields(el).querySelector('input[name="title"]') as HTMLInputElement).value).toBe('typed');
    });
  });

  describe('look', () => {
    it('passes the fields’ parts through, so a page styles them on the widget', async () => {
      const el = createElement({ widget: 'form', fields: [{ field: 'a' }] });
      await render(el);
      const parts = fieldsOf(el).getAttribute('exportparts') ?? '';
      for (const part of ['field', 'label', 'input', 'field-error', 'suggestion', 'decline', 'field-note']) {
        expect(parts.split(',').map((p) => p.trim())).toContain(part);
      }
    });

    it('sets the fields’ look from the widget’s tokens, and narrows it in a narrow container', () => {
      const styles = (customElements.get('uw-form') as unknown as { styles: { cssText: string }[] }).styles;
      const css = styles.map((s) => s.cssText).join(' ');
      expect(css).toContain('--formdown-accent-color: var(--u-widget-primary');
      expect(css).toContain('--formdown-error-color: var(--u-widget-negative');
      expect(css).toMatch(/@container uw-form \(max-width: 20rem\)/);
    });
  });

  describe('confirm widget', () => {
    it('renders the description and the actions', async () => {
      const el = createElement({
        widget: 'confirm',
        description: 'Delete this item?',
        actions: [
          { label: 'Delete', action: 'submit', style: 'danger' },
          { label: 'Cancel', action: 'cancel' },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.confirm-description')?.textContent).toBe('Delete this item?');
      expect(shadow.querySelector('button')?.getAttribute('data-style')).toBe('danger');
      expect(shadow.querySelector('formdown-ui')).toBeNull();
    });

    it('submits with no fields to check, and cancels on its button or Escape', async () => {
      const el = createElement({
        widget: 'confirm',
        actions: [{ label: 'OK', action: 'submit' }, { label: 'Cancel', action: 'cancel' }],
      });
      const shadow = await render(el);
      const { of } = events(el);
      const [ok, cancel] = Array.from(shadow.querySelectorAll('button')) as HTMLButtonElement[];
      ok.click();
      cancel.click();
      shadow.querySelector('.confirm-container')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(of('submit')).toHaveLength(1);
      expect(of('action').map((d) => d.action)).toEqual(['cancel', 'cancel']);
    });
  });
});
