// @vitest-environment node
/**
 * `parseFormdown` reads formdown with `@formdown/core` itself — these tests run the real parser, so
 * each one pins how a written form becomes the form widget's fields and actions.
 */
import { describe, it, expect } from 'vitest';
import { parseFormdown } from '../../src/core/formdown.js';

const field = (written: string) => parseFormdown(written).fields[0];

describe('parseFormdown — fields', () => {
  it('reads a text field', () => {
    expect(parseFormdown('@name: []').fields).toEqual([{ field: 'name', type: 'text', label: 'Name' }]);
  });

  it('reads required and label', () => {
    expect(field('@name*(Full Name): []')).toEqual({ field: 'name', type: 'text', label: 'Full Name', required: true });
  });

  it.each([
    ['@a: @[]', 'email'],
    ['@a: #[]', 'number'],
    ['@a: ?[]', 'password'],
    ['@a: %[]', 'tel'],
    ['@a: &[]', 'url'],
    ['@a: d[]', 'date'],
    ['@a: dt[]', 'datetime'],
    ['@a: t[]', 'time'],
    ['@a: R[]', 'range'],
    ['@a{x,y}: s[]', 'select'],
    ['@a{x,y}: r[]', 'radio'],
    ['@a{x,y}: c[]', 'checkbox'],
  ])('reads %s as %s', (written, type) => {
    expect(field(written).type).toBe(type);
  });

  it('reads a textarea with its rows (T4[])', () => {
    expect(field('@note: T4[]')).toMatchObject({ type: 'textarea', rows: 4 });
  });

  it('reads a single checkbox shown as a switch (c[switch]) as a toggle — a checkbox with choices stays one', () => {
    expect(field('@notify(Notify me): c[switch]')).toEqual({ field: 'notify', type: 'toggle', label: 'Notify me' });
    expect(field('@notify: [checkbox switch]').type).toBe('toggle');
    expect(field('@days{mon,tue}: c[switch]').type).toBe('checkbox');
  });

  it('reads a select of several values (s[multiple]) as multiselect', () => {
    expect(field('@tags{JS,TS,Rust}: s[multiple]')).toMatchObject({ type: 'multiselect', options: ['JS', 'TS', 'Rust'] });
  });

  it('keeps an option value apart from its label (value=Label)', () => {
    expect(field('@kind{hw=Hardware,sw=Software,other}: s[]').options).toEqual([
      { value: 'hw', label: 'Hardware' },
      { value: 'sw', label: 'Software' },
      'other',
    ]);
  });

  it('reads min, max and step', () => {
    expect(field('@volume: R[min=0 max=100 step=5]')).toMatchObject({ min: 0, max: 100, step: 5 });
  });

  it('keeps a date bound as text', () => {
    expect(field('@from: d[min="2026-01-01"]').min).toBe('2026-01-01');
  });

  it('reads length limits, pattern and placeholder', () => {
    expect(field('@code: [minlength=2 maxlength=10 pattern="^\\w+$" placeholder="Code"]')).toMatchObject({
      minLength: 2,
      maxLength: 10,
      pattern: '^\\w+$',
      placeholder: 'Code',
    });
  });

  it('reads every field line, skipping blank ones', () => {
    expect(parseFormdown('\n  @name: []  \n\n  @age: #[]\n').fields.map((f) => f.field)).toEqual(['name', 'age']);
  });

  it('returns nothing for empty input', () => {
    expect(parseFormdown('')).toEqual({ fields: [], actions: [], diagnostics: [] });
  });
});

describe('parseFormdown — actions', () => {
  it('maps the shorthand submit and reset by their kind, though formdown names them at random', () => {
    expect(parseFormdown('@[submit "Save"]\n@[reset "Clear"]').actions).toEqual([
      { action: 'submit', label: 'Save', style: 'primary' },
      { action: 'cancel', label: 'Clear', style: 'default' },
    ]);
  });

  it('maps the long form by its type, keeping the name for a plain button', () => {
    expect(parseFormdown('@save: [submit label="Save"]\n@preview: [button label="Preview"]').actions).toEqual([
      { action: 'submit', label: 'Save', style: 'primary' },
      { action: 'preview', label: 'Preview' },
    ]);
  });

  it('takes a style the widget knows', () => {
    expect(parseFormdown('@remove: [button label="Delete" style="danger"]').actions).toEqual([
      { action: 'remove', label: 'Delete', style: 'danger' },
    ]);
  });

  it('reads a full form', () => {
    const result = parseFormdown(
      [
        '@name*(Name): []',
        '@email*(Email): @[]',
        '@priority{low,medium,high}(Priority): s[]',
        '@message(Message): T4[]',
        '@[submit "Submit"]',
        '@[reset "Cancel"]',
      ].join('\n'),
    );
    expect(result.fields).toEqual([
      { field: 'name', label: 'Name', type: 'text', required: true },
      { field: 'email', label: 'Email', type: 'email', required: true },
      { field: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
      { field: 'message', label: 'Message', type: 'textarea', rows: 4 },
    ]);
    expect(result.actions.map((a) => a.action)).toEqual(['submit', 'cancel']);
    expect(result.diagnostics).toEqual([]);
  });
});

describe('parseFormdown — diagnostics', () => {
  it('reports a line that looks like a field but is not one, with its line', () => {
    const { fields, diagnostics } = parseFormdown('@name: []\n@notify: ^[]');
    expect(fields.map((f) => f.field)).toEqual(['name']);
    expect(diagnostics).toEqual([expect.objectContaining({ severity: 'warning', line: 2 })]);
  });

  it('says front matter is not read — the widget takes no values from it', () => {
    const { fields, diagnostics } = parseFormdown('---\ntitle: Contact\n---\n@name: []');
    expect(fields.map((f) => f.field)).toEqual(['name']);
    expect(diagnostics).toEqual([expect.objectContaining({ severity: 'warning' })]);
  });

  it('reports an unclosed attribute list as an error', () => {
    expect(parseFormdown('@name: [text').diagnostics).toEqual([expect.objectContaining({ severity: 'error', line: 1 })]);
  });
});
