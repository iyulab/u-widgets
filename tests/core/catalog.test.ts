import { describe, it, expect } from 'vitest';
import { help, template } from '../../src/core/catalog.js';
import type { WidgetDetail } from '../../src/core/catalog.js';
import { validate } from '../../src/core/schema.js';

describe('help', () => {
  it('returns all widgets when no argument', () => {
    const all = help();
    expect(all.length).toBeGreaterThanOrEqual(20);
    expect(all.some((w) => w.widget === 'chart.bar')).toBe(true);
    expect(all.some((w) => w.widget === 'metric')).toBe(true);
    expect(all.some((w) => w.widget === 'form')).toBe(true);
    expect(all.some((w) => w.widget === 'compose')).toBe(true);
  });

  it('returns WidgetDetail for exact widget match', () => {
    const result = help('chart.bar');
    // Exact match returns WidgetDetail (not array)
    expect(Array.isArray(result)).toBe(false);
    const detail = result as WidgetDetail;
    expect(detail.widget).toBe('chart.bar');
    expect(detail.category).toBe('chart');
    expect(detail.mappingKeys).toContain('x');
    expect(detail.mappingKeys).toContain('y');
    // WidgetDetail-specific fields
    expect(detail.autoInference).toBeTruthy();
    expect(detail.optionDocs).toBeDefined();
    expect(detail.events).toBeDefined();
    expect(detail.examples.length).toBeGreaterThan(0);
  });

  it('returns category match as array', () => {
    const charts = help('chart');
    expect(Array.isArray(charts)).toBe(true);
    const arr = charts as ReturnType<typeof help>;
    expect((arr as any[]).length).toBeGreaterThanOrEqual(10);
    expect((arr as any[]).every((w: any) => w.category === 'chart')).toBe(true);
  });

  it('returns display category', () => {
    const display = help('display') as any[];
    expect(display.some((w) => w.widget === 'metric')).toBe(true);
    expect(display.some((w) => w.widget === 'table')).toBe(true);
  });

  it('returns input category', () => {
    const input = help('input') as any[];
    expect(input.some((w) => w.widget === 'form')).toBe(true);
    expect(input.some((w) => w.widget === 'confirm')).toBe(true);
  });

  it('returns empty array for unknown widget', () => {
    expect(help('unknown-widget')).toEqual([]);
  });

  it('returns prefix match for "chart."', () => {
    const result = help('chart.') as any[];
    expect(result.length).toBeGreaterThanOrEqual(10);
  });

  it('each widget has required fields', () => {
    const all = help();
    for (const w of all) {
      expect(w.widget).toBeTruthy();
      expect(w.category).toBeTruthy();
      expect(w.description).toBeTruthy();
      expect(Array.isArray(w.mappingKeys)).toBe(true);
      expect(['object', 'array', 'none']).toContain(w.dataShape);
    }
  });

  it('display widgets have description and dataShape', () => {
    const display = help('display') as any[];
    for (const w of display) {
      expect(w.description).toBeTruthy();
      expect(['object', 'array', 'none']).toContain(w.dataShape);
    }
  });
});

describe('help → WidgetDetail', () => {
  it('chart.bar optionDocs includes stack but not donut', () => {
    const detail = help('chart.bar') as WidgetDetail;
    expect(detail.optionDocs).toHaveProperty('stack');
    expect(detail.optionDocs).not.toHaveProperty('donut');
  });

  it('metric dataFields includes value', () => {
    const detail = help('metric') as WidgetDetail;
    expect(detail.dataFields.some((f) => f.key === 'value')).toBe(true);
  });

  it('gauge dataFields has required value field', () => {
    const detail = help('gauge') as WidgetDetail;
    const valueField = detail.dataFields.find((f) => f.key === 'value');
    expect(valueField).toBeDefined();
    expect(valueField!.required).toBe(true);
  });

  it('form has fieldDocs and actionDocs', () => {
    const detail = help('form') as WidgetDetail;
    expect(detail.fieldDocs).toBeDefined();
    expect(detail.actionDocs).toBeDefined();
    expect(detail.fieldDocs!.field).toBeTruthy();
    expect(detail.actionDocs!.label).toBeTruthy();
  });

  it('confirm has fieldDocs and actionDocs', () => {
    const detail = help('confirm') as WidgetDetail;
    expect(detail.fieldDocs).toBeDefined();
    expect(detail.actionDocs).toBeDefined();
  });

  it('non-input widgets omit fieldDocs/actionDocs', () => {
    const detail = help('chart.bar') as WidgetDetail;
    expect(detail.fieldDocs).toBeUndefined();
    expect(detail.actionDocs).toBeUndefined();
  });

  it('chart.bar has select event', () => {
    const detail = help('chart.bar') as WidgetDetail;
    expect(detail.events).toContain('select');
  });

  it('every widget can produce a WidgetDetail', () => {
    const all = help();
    for (const info of all) {
      const detail = help(info.widget) as WidgetDetail;
      expect(detail.widget).toBe(info.widget);
      expect(typeof detail.autoInference).toBe('string');
      expect(Array.isArray(detail.dataFields)).toBe(true);
      expect(typeof detail.mappingDocs).toBe('object');
      expect(typeof detail.optionDocs).toBe('object');
      expect(Array.isArray(detail.events)).toBe(true);
      expect(Array.isArray(detail.examples)).toBe(true);
      expect(detail.examples.length).toBeGreaterThan(0);
    }
  });

  it('all examples pass validation', () => {
    const all = help();
    for (const info of all) {
      const detail = help(info.widget) as WidgetDetail;
      for (const ex of detail.examples) {
        const result = validate(ex.spec);
        expect(result.valid, `${info.widget} example "${ex.label}" failed: ${JSON.stringify(result.errors)}`).toBe(true);
      }
    }
  });

  it('mappingDocs matches mappingKeys', () => {
    const detail = help('chart.scatter') as WidgetDetail;
    // scatter has x, y, color, size
    expect(Object.keys(detail.mappingDocs)).toContain('x');
    expect(Object.keys(detail.mappingDocs)).toContain('y');
    expect(Object.keys(detail.mappingDocs)).toContain('color');
    expect(Object.keys(detail.mappingDocs)).toContain('size');
  });
});

describe('template', () => {
  it('returns valid spec for each known widget', () => {
    const all = help();
    for (const info of all) {
      const tmpl = template(info.widget);
      expect(tmpl).toBeDefined();
      expect(tmpl!.widget).toBe(info.widget);
      // Every template should pass validation
      const result = validate(tmpl);
      expect(result.valid).toBe(true);
    }
  });

  it('returns undefined for unknown widget', () => {
    expect(template('unknown')).toBeUndefined();
  });

  it('returns a deep copy (not a reference)', () => {
    const a = template('metric')!;
    const b = template('metric')!;
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.data).not.toBe(b.data);
  });

  it('chart.bar template has correct structure', () => {
    const t = template('chart.bar')!;
    expect(t.widget).toBe('chart.bar');
    expect(Array.isArray(t.data)).toBe(true);
    expect(t.mapping).toHaveProperty('x');
    expect(t.mapping).toHaveProperty('y');
  });

  it('form template has fields and actions', () => {
    const t = template('form')!;
    expect(t.widget).toBe('form');
    expect(Array.isArray(t.fields)).toBe(true);
    expect(t.fields!.length).toBeGreaterThan(0);
    expect(Array.isArray(t.actions)).toBe(true);
  });

  it('compose template has children', () => {
    const t = template('compose')!;
    expect(t.widget).toBe('compose');
    expect(Array.isArray(t.children)).toBe(true);
    expect(t.children!.length).toBeGreaterThan(0);
  });
});
