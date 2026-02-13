import { describe, it, expect } from 'vitest';
import { validate, isWidgetSpec } from '../../src/core/schema.js';

describe('validate', () => {
  it('accepts minimal valid spec', () => {
    const result = validate({ widget: 'metric', data: { value: 42 } });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts widget-only spec', () => {
    const result = validate({ widget: 'metric' });
    expect(result.valid).toBe(true);
  });

  it('rejects null', () => {
    const result = validate(null);
    expect(result.valid).toBe(false);
  });

  it('rejects non-object', () => {
    const result = validate('not an object');
    expect(result.valid).toBe(false);
  });

  it('rejects missing widget', () => {
    const result = validate({ data: { value: 42 } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('widget');
  });

  it('rejects empty widget string', () => {
    const result = validate({ widget: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects wrong type value', () => {
    const result = validate({ widget: 'metric', type: 'something-else' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('type');
  });

  it('accepts correct type value', () => {
    const result = validate({ widget: 'metric', type: 'u-widget', version: '0.1' });
    expect(result.valid).toBe(true);
  });

  it('rejects fields + formdown together', () => {
    const result = validate({
      widget: 'form',
      fields: [{ field: 'name' }],
      formdown: '@name: []',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('mutually exclusive');
  });

  it('rejects compose without children', () => {
    const result = validate({ widget: 'compose' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('children');
  });

  it('accepts compose with children', () => {
    const result = validate({
      widget: 'compose',
      children: [{ widget: 'metric', data: { value: 1 } }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects compose with invalid child', () => {
    const result = validate({
      widget: 'compose',
      children: [{ data: { value: 1 } }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('children[0]');
  });

  it('rejects compose with null child', () => {
    const result = validate({
      widget: 'compose',
      children: [null],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('children[0]');
  });

  it('rejects compose with invalid layout', () => {
    const result = validate({
      widget: 'compose',
      layout: 'invalid',
      children: [{ widget: 'metric' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('layout');
  });

  it('accepts compose with valid layout', () => {
    const result = validate({
      widget: 'compose',
      layout: 'grid',
      children: [{ widget: 'metric' }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects fields item without field property', () => {
    const result = validate({
      widget: 'form',
      fields: [{ label: 'Name' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('fields[0]');
  });

  it('accepts valid fields', () => {
    const result = validate({
      widget: 'form',
      fields: [{ field: 'name', label: 'Name' }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects actions item without label', () => {
    const result = validate({
      widget: 'form',
      actions: [{ action: 'submit' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('actions[0]');
  });

  it('accepts valid actions', () => {
    const result = validate({
      widget: 'form',
      actions: [{ label: 'Submit', action: 'submit' }],
    });
    expect(result.valid).toBe(true);
  });
});

describe('isWidgetSpec', () => {
  it('returns true for valid spec', () => {
    expect(isWidgetSpec({ widget: 'metric' })).toBe(true);
  });

  it('returns false for invalid spec', () => {
    expect(isWidgetSpec(null)).toBe(false);
    expect(isWidgetSpec({})).toBe(false);
  });
});
