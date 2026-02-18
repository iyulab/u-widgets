import { describe, it, expect } from 'vitest';
import { help, template } from '../../src/core/catalog.js';
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

  it('returns exact match for specific widget', () => {
    const result = help('chart.bar');
    expect(result).toHaveLength(1);
    expect(result[0].widget).toBe('chart.bar');
    expect(result[0].category).toBe('chart');
    expect(result[0].mappingKeys).toContain('x');
    expect(result[0].mappingKeys).toContain('y');
  });

  it('returns category match', () => {
    const charts = help('chart');
    expect(charts.length).toBeGreaterThanOrEqual(10);
    expect(charts.every((w) => w.category === 'chart')).toBe(true);
  });

  it('returns display category', () => {
    const display = help('display');
    expect(display.some((w) => w.widget === 'metric')).toBe(true);
    expect(display.some((w) => w.widget === 'table')).toBe(true);
  });

  it('returns input category', () => {
    const input = help('input');
    expect(input.some((w) => w.widget === 'form')).toBe(true);
    expect(input.some((w) => w.widget === 'confirm')).toBe(true);
  });

  it('returns empty array for unknown widget', () => {
    expect(help('unknown-widget')).toEqual([]);
  });

  it('returns prefix match for "chart."', () => {
    const result = help('chart.');
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

  it('display widgets have dataFields or optionsDocs', () => {
    const display = help('display');
    for (const w of display) {
      const hasExtra = w.dataFields != null || w.optionsDocs != null;
      expect(hasExtra).toBe(true);
    }
  });

  it('gauge includes thresholds in optionsDocs', () => {
    const gauge = help('gauge');
    expect(gauge[0].optionsDocs).toContain('thresholds');
  });

  it('metric includes dataFields', () => {
    const metric = help('metric');
    expect(metric[0].dataFields).toContain('value');
    expect(metric[0].dataFields).toContain('unit');
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
