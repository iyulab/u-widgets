import { describe, it, expect } from 'vitest';
import { normalize, normalizeMapping } from '../../src/core/normalize.js';
import type { UWidgetSpec } from '../../src/core/types.js';

describe('normalize', () => {
  it('passes through a normal spec unchanged', () => {
    const spec: UWidgetSpec = {
      widget: 'metric',
      data: { value: 42 },
    };
    const result = normalize(spec);
    expect(result).toEqual(spec);
  });

  it('moves deprecated mapping.fields to top-level fields', () => {
    const spec = {
      widget: 'form',
      mapping: {
        fields: [{ field: 'name', type: 'text' }],
      },
    } as unknown as UWidgetSpec;

    const result = normalize(spec);
    expect(result.fields).toEqual([{ field: 'name', type: 'text' }]);
    expect(result.mapping).toBeUndefined();
  });

  it('keeps mapping.fields if top-level fields already exist', () => {
    const spec = {
      widget: 'form',
      fields: [{ field: 'email' }],
      mapping: {
        fields: [{ field: 'name' }],
      },
    } as unknown as UWidgetSpec;

    const result = normalize(spec);
    expect(result.fields).toEqual([{ field: 'email' }]);
  });

  it('preserves remaining mapping properties after extracting fields', () => {
    const spec = {
      widget: 'table',
      mapping: {
        columns: [{ field: 'id' }],
        fields: [{ field: 'name' }],
      },
    } as unknown as UWidgetSpec;

    const result = normalize(spec);
    expect(result.fields).toEqual([{ field: 'name' }]);
    expect(result.mapping).toEqual({ columns: [{ field: 'id' }] });
  });

  it('converts formdown string to fields and actions', () => {
    const spec: UWidgetSpec = {
      widget: 'form',
      formdown: '@name*(Name): []\n@[submit "Save"]',
    };
    const result = normalize(spec);
    expect(result.fields).toEqual([
      { field: 'name', label: 'Name', type: 'text', required: true },
    ]);
    expect(result.actions).toEqual([
      { action: 'submit', label: 'Save', style: 'primary' },
    ]);
  });

  it('does not overwrite existing fields with formdown', () => {
    const spec: UWidgetSpec = {
      widget: 'form',
      formdown: '@other: []',
      fields: [{ field: 'name' }],
    };
    const result = normalize(spec);
    expect(result.fields).toEqual([{ field: 'name' }]);
  });

  it('does not overwrite existing actions from formdown', () => {
    const spec: UWidgetSpec = {
      widget: 'form',
      formdown: '@name: []\n@[submit "Save"]',
      actions: [{ label: 'Custom', action: 'custom' }],
    };
    const result = normalize(spec);
    expect(result.actions).toEqual([{ label: 'Custom', action: 'custom' }]);
  });
});

describe('normalizeMapping', () => {
  it('converts y string to array', () => {
    const result = normalizeMapping({ x: 'month', y: 'sales' });
    expect(result.y).toEqual(['sales']);
  });

  it('keeps y array as-is', () => {
    const result = normalizeMapping({ x: 'month', y: ['sales', 'cost'] });
    expect(result.y).toEqual(['sales', 'cost']);
  });

  it('handles undefined y', () => {
    const result = normalizeMapping({ x: 'month' });
    expect(result.y).toBeUndefined();
  });

  it('preserves other mapping fields', () => {
    const result = normalizeMapping({ x: 'month', y: 'sales', color: 'region' });
    expect(result.x).toBe('month');
    expect(result.color).toBe('region');
  });
});
