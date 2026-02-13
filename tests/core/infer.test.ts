import { describe, it, expect } from 'vitest';
import { infer } from '../../src/core/infer.js';

describe('infer', () => {
  describe('chart.bar / chart.line / chart.area / chart.scatter', () => {
    it('infers x from first string, y from first number', () => {
      const data = [
        { name: 'A', value: 30 },
        { name: 'B', value: 70 },
      ];
      const mapping = infer('chart.bar', data);
      expect(mapping).toEqual({ x: 'name', y: 'value' });
    });

    it('works with chart.line', () => {
      const data = [{ month: 'Jan', sales: 100 }];
      const mapping = infer('chart.line', data);
      expect(mapping).toEqual({ x: 'month', y: 'sales' });
    });

    it('returns undefined for empty data', () => {
      expect(infer('chart.bar', [])).toBeUndefined();
    });

    it('returns undefined for null data', () => {
      expect(infer('chart.bar', undefined)).toBeUndefined();
    });

    it('infers multi-series y when multiple number fields exist', () => {
      const data = [
        { month: 'Jan', sales: 100, cost: 60 },
        { month: 'Feb', sales: 120, cost: 65 },
      ];
      const mapping = infer('chart.line', data);
      expect(mapping).toEqual({ x: 'month', y: ['sales', 'cost'] });
    });

    it('infers single y when only one number field', () => {
      const data = [{ name: 'A', value: 30 }];
      const mapping = infer('chart.bar', data);
      expect(mapping).toEqual({ x: 'name', y: 'value' });
    });

    it('returns undefined when no string field for non-scatter', () => {
      const data = [{ a: 1, b: 2 }];
      expect(infer('chart.bar', data)).toBeUndefined();
    });

    it('infers all-numeric scatter (x=first number, y=second)', () => {
      const data = [
        { height: 170, weight: 65 },
        { height: 180, weight: 80 },
      ];
      const mapping = infer('chart.scatter', data);
      expect(mapping).toEqual({ x: 'height', y: 'weight' });
    });

    it('infers scatter with 3 numeric fields', () => {
      const data = [{ x: 1, y: 2, size: 10 }];
      const mapping = infer('chart.scatter', data);
      expect(mapping).toEqual({ x: 'x', y: ['y', 'size'] });
    });
  });

  describe('chart.pie', () => {
    it('infers label and value', () => {
      const data = [
        { category: 'Desktop', share: 58 },
        { category: 'Mobile', share: 35 },
      ];
      const mapping = infer('chart.pie', data);
      expect(mapping).toEqual({ label: 'category', value: 'share' });
    });
  });

  describe('chart.radar', () => {
    it('infers axis and value', () => {
      const data = [{ skill: 'JS', score: 80 }];
      const mapping = infer('chart.radar', data);
      expect(mapping).toEqual({ axis: 'skill', value: 'score' });
    });
  });

  describe('table', () => {
    it('infers all keys as columns', () => {
      const data = [{ name: 'A', age: 30, role: 'dev' }];
      const mapping = infer('table', data);
      expect(mapping).toEqual({
        columns: [{ field: 'name' }, { field: 'age' }, { field: 'role' }],
      });
    });
  });

  describe('list', () => {
    it('infers primary and secondary from string fields', () => {
      const data = [{ text: 'Task 1', status: 'done', priority: 1 }];
      const mapping = infer('list', data);
      expect(mapping).toEqual({ primary: 'text', secondary: 'status' });
    });

    it('infers only primary when one string field', () => {
      const data = [{ text: 'Task 1', count: 5 }];
      const mapping = infer('list', data);
      expect(mapping).toEqual({ primary: 'text', secondary: undefined });
    });
  });

  describe('edge cases', () => {
    it('returns undefined for empty objects in array', () => {
      expect(infer('chart.bar', [{}])).toBeUndefined();
    });

    it('returns undefined for all-boolean data (chart)', () => {
      expect(infer('chart.bar', [{ a: true, b: false }])).toBeUndefined();
    });

    it('returns undefined for pie with no string field', () => {
      expect(infer('chart.pie', [{ a: 1, b: 2 }])).toBeUndefined();
    });

    it('returns undefined for radar with no number field', () => {
      expect(infer('chart.radar', [{ a: 'x', b: 'y' }])).toBeUndefined();
    });

    it('returns undefined for list with no string fields', () => {
      expect(infer('list', [{ a: 1, b: 2 }])).toBeUndefined();
    });

    it('wraps single record (non-array) into array', () => {
      const mapping = infer('chart.bar', { name: 'A', value: 30 });
      expect(mapping).toEqual({ x: 'name', y: 'value' });
    });

    it('returns undefined for scatter with only 1 numeric field', () => {
      expect(infer('chart.scatter', [{ a: 1 }])).toBeUndefined();
    });
  });

  describe('non-inferred widgets', () => {
    it('returns undefined for metric', () => {
      expect(infer('metric', { value: 42 })).toBeUndefined();
    });

    it('returns undefined for gauge', () => {
      expect(infer('gauge', { value: 73 })).toBeUndefined();
    });

    it('returns undefined for form', () => {
      expect(infer('form', { name: 'test' })).toBeUndefined();
    });
  });
});
