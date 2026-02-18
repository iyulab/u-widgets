import { describe, it, expect } from 'vitest';
import { suggestMapping, autoSpec } from '../../src/core/suggest-mapping.js';

describe('suggestMapping', () => {
  it('suggests chart.bar for category × value array', () => {
    const data = [{ name: 'A', value: 30 }, { name: 'B', value: 70 }];
    const suggestions = suggestMapping(data);
    expect(suggestions.length).toBeGreaterThan(0);
    const top = suggestions[0];
    expect(top.widget).toBe('chart.bar');
    expect(top.mapping).toBeDefined();
    expect(top.confidence).toBeGreaterThan(0.8);
  });

  it('suggests metric for object with value key', () => {
    const data = { value: 42, unit: 'users' };
    const suggestions = suggestMapping(data);
    expect(suggestions[0].widget).toBe('metric');
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('suggests chart.scatter for all-numeric array', () => {
    const data = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.scatter')).toBe(true);
  });

  it('suggests stat-group for array with label+value', () => {
    const data = [
      { label: 'CPU', value: 73, suffix: '%' },
      { label: 'Memory', value: 85, suffix: '%' },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'stat-group')).toBe(true);
  });

  it('suggests table for multi-field array', () => {
    const data = [
      { name: 'Alice', role: 'Engineer', status: 'Active' },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'table')).toBe(true);
  });

  it('constrains to specific widget when provided', () => {
    const data = [{ name: 'A', value: 30 }];
    const suggestions = suggestMapping(data, 'chart.pie');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].widget).toBe('chart.pie');
    expect(suggestions[0].mapping).toBeDefined();
  });

  it('returns low confidence for constrained widget with bad data', () => {
    const data = { value: 42 }; // object, not array
    const suggestions = suggestMapping(data, 'chart.bar');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].confidence).toBeLessThan(0.5);
  });

  it('returns empty for null data', () => {
    expect(suggestMapping(null as unknown as Record<string, unknown>)).toEqual([]);
  });

  it('returns empty for empty array', () => {
    expect(suggestMapping([])).toEqual([]);
  });

  it('suggestions are sorted by confidence descending', () => {
    const data = [{ name: 'A', value: 30 }, { name: 'B', value: 70 }];
    const suggestions = suggestMapping(data);
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
    }
  });

  it('includes multi-series suggestion for multiple number columns', () => {
    const data = [{ month: 'Jan', sales: 100, cost: 60 }];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.line')).toBe(true);
  });
});

describe('autoSpec', () => {
  it('returns a complete spec for chart data', () => {
    const data = [{ name: 'A', value: 30 }, { name: 'B', value: 70 }];
    const spec = autoSpec(data);
    expect(spec).toBeDefined();
    expect(spec!.widget).toBe('chart.bar');
    expect(spec!.data).toBe(data);
    expect(spec!.mapping).toBeDefined();
  });

  it('returns a metric spec for object data', () => {
    const data = { value: 42 };
    const spec = autoSpec(data);
    expect(spec).toBeDefined();
    expect(spec!.widget).toBe('metric');
  });

  it('returns undefined for empty data', () => {
    expect(autoSpec([])).toBeUndefined();
  });
});
