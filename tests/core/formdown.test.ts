import { describe, it, expect } from 'vitest';
import { parseFormdown } from '../../src/core/formdown.js';

describe('parseFormdown', () => {
  it('parses basic text field', () => {
    const result = parseFormdown('@name: []');
    expect(result.fields).toEqual([
      { field: 'name', type: 'text' },
    ]);
  });

  it('parses required field', () => {
    const result = parseFormdown('@name*: []');
    expect(result.fields[0].required).toBe(true);
  });

  it('parses label', () => {
    const result = parseFormdown('@name(Full Name): []');
    expect(result.fields[0].label).toBe('Full Name');
  });

  it('parses options', () => {
    const result = parseFormdown('@size{S,M,L}: r[]');
    expect(result.fields[0].options).toEqual(['S', 'M', 'L']);
    expect(result.fields[0].type).toBe('radio');
  });

  it('parses email field (@[])', () => {
    const result = parseFormdown('@email: @[]');
    expect(result.fields[0].type).toBe('email');
  });

  it('parses number field (#[])', () => {
    const result = parseFormdown('@age: #[]');
    expect(result.fields[0].type).toBe('number');
  });

  it('parses number field with min/max', () => {
    const result = parseFormdown('@age: #[min=18,max=120]');
    expect(result.fields[0].type).toBe('number');
    expect(result.fields[0].min).toBe(18);
    expect(result.fields[0].max).toBe(120);
  });

  it('parses password field (?[])', () => {
    const result = parseFormdown('@pwd: ?[]');
    expect(result.fields[0].type).toBe('password');
  });

  it('parses tel field (%[])', () => {
    const result = parseFormdown('@phone: %[]');
    expect(result.fields[0].type).toBe('tel');
  });

  it('parses url field (&[])', () => {
    const result = parseFormdown('@website: &[]');
    expect(result.fields[0].type).toBe('url');
  });

  it('parses textarea with rows (T4[])', () => {
    const result = parseFormdown('@message: T4[]');
    expect(result.fields[0].type).toBe('textarea');
    expect(result.fields[0].rows).toBe(4);
  });

  it('parses date field (d[])', () => {
    const result = parseFormdown('@birth: d[]');
    expect(result.fields[0].type).toBe('date');
  });

  it('parses datetime field (dt[])', () => {
    const result = parseFormdown('@created: dt[]');
    expect(result.fields[0].type).toBe('datetime');
  });

  it('parses time field (t[])', () => {
    const result = parseFormdown('@alarm: t[]');
    expect(result.fields[0].type).toBe('time');
  });

  it('parses select field (s[])', () => {
    const result = parseFormdown('@priority{low,medium,high}: s[]');
    expect(result.fields[0].type).toBe('select');
    expect(result.fields[0].options).toEqual(['low', 'medium', 'high']);
  });

  it('parses checkbox field (c[])', () => {
    const result = parseFormdown('@skills{JS,TS,Rust}: c[]');
    expect(result.fields[0].type).toBe('checkbox');
    expect(result.fields[0].options).toEqual(['JS', 'TS', 'Rust']);
  });

  it('parses action buttons', () => {
    const result = parseFormdown('@[submit "Save"]');
    expect(result.actions).toEqual([
      { action: 'submit', label: 'Save', style: 'primary' },
    ]);
  });

  it('parses cancel action', () => {
    const result = parseFormdown('@[cancel "Dismiss"]');
    expect(result.actions).toEqual([
      { action: 'cancel', label: 'Dismiss', style: 'default' },
    ]);
  });

  it('parses action with explicit style', () => {
    const result = parseFormdown('@[submit "Delete" danger]');
    expect(result.actions[0].style).toBe('danger');
  });

  it('parses full form', () => {
    const input = [
      '@name*(Name): []',
      '@email*(Email): @[]',
      '@priority{low,medium,high}(Priority): s[]',
      '@message(Message): T4[]',
      '@[submit "Submit"]',
      '@[cancel "Cancel"]',
    ].join('\n');

    const result = parseFormdown(input);
    expect(result.fields.length).toBe(4);
    expect(result.fields[0]).toEqual({
      field: 'name', label: 'Name', type: 'text', required: true,
    });
    expect(result.fields[1]).toEqual({
      field: 'email', label: 'Email', type: 'email', required: true,
    });
    expect(result.fields[2]).toEqual({
      field: 'priority', label: 'Priority', type: 'select',
      options: ['low', 'medium', 'high'],
    });
    expect(result.fields[3]).toEqual({
      field: 'message', label: 'Message', type: 'textarea', rows: 4,
    });
    expect(result.actions.length).toBe(2);
    expect(result.actions[0].action).toBe('submit');
    expect(result.actions[1].action).toBe('cancel');
  });

  it('ignores empty lines and whitespace', () => {
    const input = '\n  @name: []  \n\n  @age: #[]\n';
    const result = parseFormdown(input);
    expect(result.fields.length).toBe(2);
  });

  it('returns empty result for empty input', () => {
    const result = parseFormdown('');
    expect(result.fields).toEqual([]);
    expect(result.actions).toEqual([]);
  });

  // Toggle, Range, Multiselect markers
  it('parses toggle field (^[])', () => {
    const result = parseFormdown('@notify: ^[]');
    expect(result.fields[0].type).toBe('toggle');
  });

  it('parses range field (R[])', () => {
    const result = parseFormdown('@volume: R[min=0,max=100]');
    expect(result.fields[0].type).toBe('range');
    expect(result.fields[0].min).toBe(0);
    expect(result.fields[0].max).toBe(100);
  });

  it('parses range field with step', () => {
    const result = parseFormdown('@brightness: R[min=0,max=100,step=5]');
    expect(result.fields[0].type).toBe('range');
    expect(result.fields[0].step).toBe(5);
  });

  it('parses multiselect field (ms[])', () => {
    const result = parseFormdown('@tags{JS,TS,Rust,Go}: ms[]');
    expect(result.fields[0].type).toBe('multiselect');
    expect(result.fields[0].options).toEqual(['JS', 'TS', 'Rust', 'Go']);
  });

  it('accepts optional _data parameter without error', () => {
    const result = parseFormdown('@name: []', { name: 'test' });
    expect(result.fields[0].field).toBe('name');
  });
});
