/**
 * Pipeline integration tests: validate → normalize → infer → render
 *
 * Tests the full data pipeline from raw spec to rendered element,
 * verifying that all core modules work together correctly.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { validate } from '../../src/core/schema.js';
import { normalize } from '../../src/core/normalize.js';
import { infer } from '../../src/core/infer.js';
import { formatValue } from '../../src/core/format.js';
import { suggestWidget } from '../../src/core/suggest.js';
import type { UWidgetSpec } from '../../src/core/types.js';

// Import elements to ensure custom elements are registered
import '../../src/elements/u-widget.js';
import type { UWidget } from '../../src/elements/u-widget.js';

describe('pipeline integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('validate → normalize → infer → render', () => {
    it('metric: minimal spec flows through entire pipeline', async () => {
      const raw: UWidgetSpec = {
        widget: 'metric',
        data: { value: 42, label: 'Users Online' },
      };

      // Step 1: validate
      const validation = validate(raw);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 2: normalize
      const normalized = normalize(raw);
      expect(normalized.widget).toBe('metric');

      // Step 3: infer (metric doesn't need mapping)
      const mapping = infer(normalized.widget, normalized.data as Record<string, unknown>);
      expect(mapping).toBeUndefined();

      // Step 4: render via <u-widget>
      const el = document.createElement('u-widget') as UWidget;
      el.spec = raw;
      document.body.appendChild(el);
      await el.updateComplete;

      expect(el.shadowRoot).not.toBeNull();
    });

    it('table: array data flows through validate → normalize → infer', () => {
      const raw: UWidgetSpec = {
        widget: 'table',
        data: [
          { name: 'Alice', age: 30, city: 'Seoul' },
          { name: 'Bob', age: 25, city: 'Busan' },
        ],
      };

      const validation = validate(raw);
      expect(validation.valid).toBe(true);

      const normalized = normalize(raw);
      const mapping = infer(normalized.widget, normalized.data as Record<string, unknown>[]);
      expect(mapping).toBeDefined();
      // columns is array of { field: string }
      const colFields = (mapping!.columns as { field: string }[]).map((c) => c.field);
      expect(colFields).toContain('name');
      expect(colFields).toContain('age');
      expect(colFields).toContain('city');
    });

    it('chart.bar: infer produces x/y mapping from data', () => {
      const raw: UWidgetSpec = {
        widget: 'chart.bar',
        data: [
          { month: 'Jan', revenue: 100 },
          { month: 'Feb', revenue: 200 },
        ],
      };

      const validation = validate(raw);
      expect(validation.valid).toBe(true);

      const mapping = infer(raw.widget, raw.data as Record<string, unknown>[]);
      expect(mapping).toBeDefined();
      expect(mapping!.x).toBe('month');
      expect(mapping!.y).toBe('revenue');
    });

    it('form with formdown: normalize parses formdown into fields', () => {
      const raw: UWidgetSpec = {
        widget: 'form',
        formdown: '# Name\n@name: []\n---\n[Submit]',
      };

      const validation = validate(raw);
      expect(validation.valid).toBe(true);

      const normalized = normalize(raw);
      expect(normalized.fields).toBeDefined();
      expect(normalized.fields!.length).toBeGreaterThan(0);
      expect(normalized.fields![0].field).toBe('name');
    });

    it('chart.pie: infer produces label/value mapping', () => {
      const raw: UWidgetSpec = {
        widget: 'chart.pie',
        data: [
          { category: 'Desktop', share: 60 },
          { category: 'Mobile', share: 30 },
          { category: 'Tablet', share: 10 },
        ],
      };

      const mapping = infer(raw.widget, raw.data as Record<string, unknown>[]);
      expect(mapping).toBeDefined();
      expect(mapping!.label).toBe('category');
      expect(mapping!.value).toBe('share');
    });

    it('list: infer produces primary/secondary mapping', () => {
      const raw: UWidgetSpec = {
        widget: 'list',
        data: [
          { title: 'Item 1', description: 'Desc 1', status: 'active' },
          { title: 'Item 2', description: 'Desc 2', status: 'inactive' },
        ],
      };

      const mapping = infer(raw.widget, raw.data as Record<string, unknown>[]);
      expect(mapping).toBeDefined();
      expect(mapping!.primary).toBe('title');
      expect(mapping!.secondary).toBe('description');
    });
  });

  describe('suggestWidget → typo correction', () => {
    it('suggestWidget corrects chart.barr → chart.bar', () => {
      const suggestion = suggestWidget('chart.barr');
      expect(suggestion).toBe('chart.bar');
    });

    it('suggestWidget corrects metrc → metric', () => {
      const suggestion = suggestWidget('metrc');
      expect(suggestion).toBe('metric');
    });

    it('suggestWidget returns undefined for totally unknown input', () => {
      const suggestion = suggestWidget('xyzabcdef');
      expect(suggestion).toBeUndefined();
    });
  });

  describe('formatValue integration', () => {
    it('formats number values correctly', () => {
      expect(formatValue(1234, 'number')).toBe('1,234');
    });

    it('formats percent values correctly', () => {
      expect(formatValue(75, 'percent')).toBe('75%');
    });

    it('formats currency values correctly', () => {
      expect(formatValue(99.99, 'currency')).toContain('99.99');
    });
  });

  describe('validation catches invalid specs', () => {
    it('rejects spec without widget field', () => {
      const result = validate({} as UWidgetSpec);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('errors when data type mismatches widget expectation', () => {
      const result = validate({
        widget: 'table',
        data: { name: 'not an array' },
      } as UWidgetSpec);
      // table expects array data → produces error, not warning
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('array'))).toBe(true);
    });

    it('validates form fields with invalid field type', () => {
      const result = validate({
        widget: 'form',
        fields: [{ field: 'x', type: 'invalid-type' as any }],
      } as UWidgetSpec);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
