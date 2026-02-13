import { describe, it, expect } from 'vitest';
import {
  mapFields,
  mapActions,
  mapFieldType,
  type FormdownField,
} from '../../src/adapters/formdown-adapter.js';

describe('mapFieldType', () => {
  it('maps known types', () => {
    expect(mapFieldType('text')).toBe('text');
    expect(mapFieldType('email')).toBe('email');
    expect(mapFieldType('number')).toBe('number');
    expect(mapFieldType('textarea')).toBe('textarea');
    expect(mapFieldType('select')).toBe('select');
    expect(mapFieldType('multiselect')).toBe('multiselect');
    expect(mapFieldType('toggle')).toBe('toggle');
    expect(mapFieldType('range')).toBe('range');
    expect(mapFieldType('radio')).toBe('radio');
    expect(mapFieldType('checkbox')).toBe('checkbox');
    expect(mapFieldType('date')).toBe('date');
    expect(mapFieldType('datetime')).toBe('datetime');
    expect(mapFieldType('datetime-local')).toBe('datetime');
    expect(mapFieldType('time')).toBe('time');
    expect(mapFieldType('password')).toBe('password');
    expect(mapFieldType('tel')).toBe('tel');
    expect(mapFieldType('url')).toBe('url');
  });

  it('falls back to text for unknown types', () => {
    expect(mapFieldType('unknown')).toBe('text');
    expect(mapFieldType('')).toBe('text');
  });
});

describe('mapFields', () => {
  it('maps basic field', () => {
    const fields: FormdownField[] = [
      { name: 'username', type: 'text' },
    ];
    expect(mapFields(fields)).toEqual([
      { field: 'username', type: 'text' },
    ]);
  });

  it('maps field with all properties', () => {
    const fields: FormdownField[] = [
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'you@example.com',
        options: [],
        attributes: { maxlength: '255' },
      },
    ];
    const result = mapFields(fields);
    expect(result[0]).toEqual({
      field: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'you@example.com',
      maxLength: 255,
    });
  });

  it('maps options', () => {
    const fields: FormdownField[] = [
      { name: 'color', type: 'select', options: ['red', 'green', 'blue'] },
    ];
    expect(mapFields(fields)[0].options).toEqual(['red', 'green', 'blue']);
  });

  it('does not include empty options array', () => {
    const fields: FormdownField[] = [
      { name: 'name', type: 'text', options: [] },
    ];
    expect(mapFields(fields)[0].options).toBeUndefined();
  });

  it('maps numeric attributes', () => {
    const fields: FormdownField[] = [
      {
        name: 'score',
        type: 'range',
        attributes: { min: '0', max: '100', step: '5' },
      },
    ];
    const result = mapFields(fields)[0];
    expect(result.min).toBe(0);
    expect(result.max).toBe(100);
    expect(result.step).toBe(5);
  });

  it('maps rows attribute for textarea', () => {
    const fields: FormdownField[] = [
      { name: 'bio', type: 'textarea', attributes: { rows: '6' } },
    ];
    expect(mapFields(fields)[0].rows).toBe(6);
  });

  it('handles non-numeric min/max as strings', () => {
    const fields: FormdownField[] = [
      { name: 'start', type: 'date', attributes: { min: '2024-01-01' } },
    ];
    expect(mapFields(fields)[0].min).toBe('2024-01-01');
  });

  it('omits undefined label/placeholder/required', () => {
    const fields: FormdownField[] = [
      { name: 'x', type: 'text' },
    ];
    const result = mapFields(fields)[0];
    expect(result).toEqual({ field: 'x', type: 'text' });
    expect('label' in result).toBe(false);
    expect('required' in result).toBe(false);
    expect('placeholder' in result).toBe(false);
  });
});

describe('mapActions', () => {
  it('maps submit action', () => {
    const actions: FormdownField[] = [
      { name: 'submit', type: 'button', label: 'Save' },
    ];
    expect(mapActions(actions)).toEqual([
      { action: 'submit', label: 'Save', style: 'primary' },
    ]);
  });

  it('maps reset to cancel', () => {
    const actions: FormdownField[] = [
      { name: 'reset', type: 'button', label: 'Cancel' },
    ];
    expect(mapActions(actions)).toEqual([
      { action: 'cancel', label: 'Cancel', style: 'default' },
    ]);
  });

  it('maps custom action', () => {
    const actions: FormdownField[] = [
      { name: 'preview', type: 'button', label: 'Preview' },
    ];
    const result = mapActions(actions);
    expect(result[0].action).toBe('preview');
    expect(result[0].label).toBe('Preview');
    expect(result[0].style).toBeUndefined();
  });

  it('uses name as fallback label', () => {
    const actions: FormdownField[] = [
      { name: 'submit', type: 'button' },
    ];
    expect(mapActions(actions)[0].label).toBe('submit');
  });
});
