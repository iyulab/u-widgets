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

  it('suggests chart.radar for category with multiple numeric fields', () => {
    const data = [
      { axis: 'Speed', player1: 80, player2: 90 },
      { axis: 'Power', player1: 70, player2: 60 },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.radar')).toBe(true);
  });

  it('suggests chart.heatmap for 2 string + 1 number pattern', () => {
    const data = [
      { day: 'Mon', hour: '9am', temp: 22 },
      { day: 'Tue', hour: '10am', temp: 25 },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.heatmap')).toBe(true);
  });

  it('suggests chart.box for 5+ numeric fields', () => {
    const data = [
      { group: 'A', min: 10, q1: 25, median: 50, q3: 75, max: 90 },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.box')).toBe(true);
  });

  it('suggests chart.funnel for label + single value', () => {
    const data = [
      { stage: 'Visit', count: 1000 },
      { stage: 'Signup', count: 500 },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.funnel')).toBe(true);
  });

  it('suggests chart.waterfall for category + value', () => {
    const data = [
      { item: 'Revenue', amount: 100 },
      { item: 'Cost', amount: -60 },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.waterfall')).toBe(true);
  });

  it('suggests chart.treemap for category + value', () => {
    const data = [
      { category: 'Tech', size: 300 },
      { category: 'Health', size: 200 },
    ];
    const suggestions = suggestMapping(data);
    expect(suggestions.some((s) => s.widget === 'chart.treemap')).toBe(true);
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

describe('non-chart suggestions', () => {
  it('suggests progress for object with value + max', () => {
    const data = { value: 75, max: 100 };
    const suggestions = suggestMapping(data);
    const progress = suggestions.find((s) => s.widget === 'progress');
    expect(progress).toBeDefined();
    expect(progress!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('suggests gauge for object with value only', () => {
    const data = { value: 42 };
    const suggestions = suggestMapping(data);
    const gauge = suggestions.find((s) => s.widget === 'gauge');
    expect(gauge).toBeDefined();
  });

  it('suggests chart.area for date-like time-series data', () => {
    const data = [
      { date: '2024-01-01', sales: 100 },
      { date: '2024-02-01', sales: 200 },
    ];
    const suggestions = suggestMapping(data);
    const area = suggestions.find((s) => s.widget === 'chart.area');
    expect(area).toBeDefined();
    expect(area!.reason).toContain('Date-like');
  });

  it('does not suggest chart.area for non-date strings', () => {
    const data = [
      { name: 'Alice', score: 90 },
      { name: 'Bob', score: 85 },
    ];
    const suggestions = suggestMapping(data);
    const area = suggestions.find((s) => s.widget === 'chart.area');
    expect(area).toBeUndefined();
  });

  it('suggests kv for flat object with all primitive values', () => {
    const data = { status: 'Active', plan: 'Pro', users: 42 };
    const suggestions = suggestMapping(data);
    const kv = suggestions.find((s) => s.widget === 'kv');
    expect(kv).toBeDefined();
    expect(kv!.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('suggests kv for array of {key, value} objects', () => {
    const data = [
      { key: 'Name', value: 'Alice' },
      { key: 'Role', value: 'Engineer' },
    ];
    const suggestions = suggestMapping(data);
    const kv = suggestions.find((s) => s.widget === 'kv');
    expect(kv).toBeDefined();
    expect(kv!.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('does not suggest kv for object with value key (prefers metric)', () => {
    const data = { value: 42, unit: '%' };
    const suggestions = suggestMapping(data);
    expect(suggestions[0].widget).toBe('metric');
  });
});
