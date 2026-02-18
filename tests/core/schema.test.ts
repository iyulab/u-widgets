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

  // ── Data type validation ──

  it('rejects array data for metric', () => {
    const result = validate({ widget: 'metric', data: [{ value: 1 }] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('object');
  });

  it('rejects object data for table', () => {
    const result = validate({ widget: 'table', data: { name: 'Alice' } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('array');
  });

  it('rejects object data for chart.bar', () => {
    const result = validate({ widget: 'chart.bar', data: { x: 1, y: 2 } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('array');
  });

  it('accepts array data for table', () => {
    const result = validate({ widget: 'table', data: [{ name: 'Alice' }] });
    expect(result.valid).toBe(true);
  });

  it('accepts object data for metric', () => {
    const result = validate({ widget: 'metric', data: { value: 42 } });
    expect(result.valid).toBe(true);
  });

  it('allows missing data (not required)', () => {
    const result = validate({ widget: 'table' });
    expect(result.valid).toBe(true);
  });

  it('does not false-positive on substring widget names', () => {
    // "bar" is a substring of "chart.bar" — should NOT trigger array check
    const result = validate({ widget: 'bar', data: { value: 1 } });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('does not false-positive on "line" substring', () => {
    const result = validate({ widget: 'line', data: { value: 1 } });
    expect(result.valid).toBe(true);
  });

  it('does not false-positive on "ist" substring of "list"', () => {
    const result = validate({ widget: 'ist', data: { value: 1 } });
    expect(result.valid).toBe(true);
  });

  // ── Warnings field ──

  it('no warnings for valid spec', () => {
    const result = validate({ widget: 'gauge' });
    expect(result.warnings).toHaveLength(0);
  });

  // ── Warnings field always present ──

  it('includes warnings field even when empty', () => {
    const result = validate({ widget: 'metric' });
    expect(result.warnings).toEqual([]);
  });

  it('includes warnings field on invalid spec', () => {
    const result = validate(null);
    expect(result.warnings).toEqual([]);
  });

  // ── Mapping field validation ──

  it('warns when mapping.x references missing field', () => {
    const result = validate({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 30 }],
      mapping: { x: 'category', y: 'value' },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('category');
  });

  it('warns when mapping.y references missing field', () => {
    const result = validate({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 30 }],
      mapping: { x: 'name', y: 'amount' },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('amount'))).toBe(true);
  });

  it('warns when mapping.y array references missing field', () => {
    const result = validate({
      widget: 'chart.line',
      data: [{ month: 'Jan', sales: 100, cost: 60 }],
      mapping: { x: 'month', y: ['sales', 'revenue'] },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('"revenue"'))).toBe(true);
    // only 1 warning for 'revenue', not for 'sales'
    expect(result.warnings).toHaveLength(1);
  });

  it('no warnings when mapping fields match data', () => {
    const result = validate({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 30 }],
      mapping: { x: 'name', y: 'value' },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('no warnings when mapping is omitted', () => {
    const result = validate({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 30 }],
    });
    expect(result.warnings).toHaveLength(0);
  });

  it('warns for list mapping referencing missing fields', () => {
    const result = validate({
      widget: 'list',
      data: [{ name: 'Alice', role: 'Dev' }],
      mapping: { primary: 'name', secondary: 'title' },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('title'))).toBe(true);
  });

  // ── Field type validation (6.5-D) ──

  it('warns on unrecognized field.type', () => {
    const result = validate({
      widget: 'form',
      fields: [{ field: 'x', type: 'foobar' }],
    });
    expect(result.valid).toBe(true); // warning, not error
    expect(result.warnings.some((w) => w.includes('foobar'))).toBe(true);
  });

  it('no warning for valid field types', () => {
    const result = validate({
      widget: 'form',
      fields: [
        { field: 'a', type: 'text' },
        { field: 'b', type: 'email' },
        { field: 'c', type: 'number' },
        { field: 'd', type: 'toggle' },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('no warning when field.type is omitted', () => {
    const result = validate({
      widget: 'form',
      fields: [{ field: 'name' }],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  // ── Compose recursion depth (6.5-D) ──

  it('rejects deeply nested compose children', () => {
    // Build 12-level deep compose
    let spec: Record<string, unknown> = { widget: 'metric', data: { value: 1 } };
    for (let i = 0; i < 12; i++) {
      spec = { widget: 'compose', children: [spec] };
    }
    const result = validate(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nesting depth'))).toBe(true);
  });

  it('accepts moderately nested compose children', () => {
    const result = validate({
      widget: 'compose',
      children: [{
        widget: 'compose',
        children: [{ widget: 'metric', data: { value: 1 } }],
      }],
    });
    expect(result.valid).toBe(true);
  });

  // ── Compose child validation propagation (6.5-D) ──

  it('propagates child validation errors', () => {
    const result = validate({
      widget: 'compose',
      children: [{
        widget: 'metric',
        data: [1, 2, 3], // object expected, not array
      }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('children[0]'))).toBe(true);
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
