import { describe, it, expect } from 'vitest';
import { suggestWidget } from '../../src/core/suggest.js';

describe('suggestWidget', () => {
  it('suggests exact typo fixes for chart types', () => {
    expect(suggestWidget('chart.barr')).toBe('chart.bar');
    expect(suggestWidget('chart.lin')).toBe('chart.line');
    expect(suggestWidget('chart.piee')).toBe('chart.pie');
    expect(suggestWidget('chart.scater')).toBe('chart.scatter');
  });

  it('suggests fixes for non-chart types', () => {
    expect(suggestWidget('metrc')).toBe('metric');
    expect(suggestWidget('metirc')).toBe('metric');
    expect(suggestWidget('tabel')).toBe('table');
    expect(suggestWidget('guage')).toBe('gauge');
    expect(suggestWidget('progres')).toBe('progress');
    expect(suggestWidget('lst')).toBe('list');
    expect(suggestWidget('frm')).toBe('form');
  });

  it('suggests compose typos', () => {
    expect(suggestWidget('compos')).toBe('compose');
    expect(suggestWidget('compse')).toBe('compose');
  });

  it('returns undefined for unrecognizable names', () => {
    expect(suggestWidget('xyzabc')).toBeUndefined();
    expect(suggestWidget('completely-wrong')).toBeUndefined();
    expect(suggestWidget('foobar')).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(suggestWidget('')).toBeUndefined();
  });

  it('returns undefined for exact matches (distance 0)', () => {
    expect(suggestWidget('metric')).toBeUndefined();
    expect(suggestWidget('chart.bar')).toBeUndefined();
    expect(suggestWidget('table')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(suggestWidget('METRC')).toBe('metric');
    expect(suggestWidget('Chart.Barr')).toBe('chart.bar');
  });

  it('suggests content widget types', () => {
    expect(suggestWidget('markdwn')).toBe('markdown');
    expect(suggestWidget('calout')).toBe('callout');
  });

  it('handles stat-group typos', () => {
    expect(suggestWidget('stat-grop')).toBe('stat-group');
  });
});
