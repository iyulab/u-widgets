// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { checkSpec } from '../../src/core/check-spec.js';
import { help } from '../../src/core/catalog.js';
import { specErrorMessage } from '../../src/core/schema.js';
import type { WidgetDetail } from '../../src/core/catalog.js';

describe('checkSpec', () => {
  it('takes every example the catalog gives, with nothing to warn about', () => {
    for (const { widget } of help()) {
      for (const { label, spec } of (help(widget) as WidgetDetail).examples ?? []) {
        expect(checkSpec(spec), `${widget} — ${label}`).toMatchObject({ valid: true, warnings: [] });
      }
    }
  });

  it('refuses a widget the library does not have, and names the near spelling', () => {
    const result = checkSpec({ widget: 'lst', data: [] });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([{ code: 'widget-unknown', params: { widget: 'lst' }, path: [] }]);
    expect(result.errors).toEqual([specErrorMessage(result.issues[0])]);
    expect(result.warnings).toEqual(['did you mean "list"?']);
    expect(checkSpec({ widget: 'chart.bars' }).warnings).toEqual(['did you mean "chart.bar"?']);
  });

  it('warns of a key no widget reads, naming the keys a spec takes', () => {
    const { valid, warnings } = checkSpec({ widget: 'list', data: [{ a: 1 }], rows: [1] });
    expect(valid).toBe(true);
    expect(warnings).toEqual([expect.stringMatching(/^"rows" is not read by any widget — a spec takes id, title, .*data, mapping/)]);
  });

  it('says to move an option of the widget written at the top level into options', () => {
    const { warnings } = checkSpec({ widget: 'list', data: [{ a: 1 }], compact: true });
    expect(warnings).toEqual(['"compact" is an option of list — put it in options: { "compact": … }']);
  });

  it('warns of an option the widget does not have, and of an option value of the wrong type', () => {
    expect(checkSpec({ widget: 'list', data: [], options: { compact: 'yes', dense: true } }).warnings).toEqual([
      'options.compact should be a boolean, not "yes"',
      'options.dense is not an option of list — it takes compact, layout, maxItems',
    ]);
    expect(checkSpec({ widget: 'gauge', data: { value: 3 }, options: { max: '100' } }).warnings).toEqual(['options.max should be a number, not "100"']);
    expect(checkSpec({ widget: 'metric', data: { value: 3 }, options: { unit: 'kW' } }).warnings).toEqual(['options.unit is not an option of metric — it takes format']);
  });

  it('takes the options each chart draws — an area chart its reference lines, as a line chart does', () => {
    const referenceLines = [{ axis: 'y', value: 5 }];
    for (const widget of ['chart.line', 'chart.area', 'chart.bar'])
      expect(checkSpec({ widget, data: [{ x: 'a', y: 1 }], options: { referenceLines } }).warnings, widget).toEqual([]);
  });

  it('takes the raw ECharts option on every chart, as documented', () => {
    for (const widget of ['chart.bar', 'chart.funnel', 'chart.gantt'])
      expect(checkSpec({ widget, data: [], options: { echarts: { xAxis: { axisLabel: { interval: 0 } } } } }).warnings, widget).toEqual([]);
  });

  it('names a field a reference line or a series does not have, and a value of the wrong kind', () => {
    const warnings = checkSpec({
      widget: 'chart.bar',
      data: [{ x: 'a', y: 1 }],
      options: {
        referenceLines: [{ value: 30, label: 'Target', lineStyle: 'dashed' }, { axis: 'z', value: 1, style: 'dashed' }],
        series: [{ label: 'mph', lineStyle: 'dash' }, { lineStyle: { type: 'dashed' } }],
      },
    }).warnings;
    expect(warnings).toEqual([
      'options.referenceLines[0].lineStyle is not a field of a reference line — it takes axis, value, label, color, style',
      'options.referenceLines[1].axis should be one of "x", "y", not "z"',
      'options.series[0].lineStyle should be one of "solid", "dashed", "dotted", not "dash"',
    ]);
  });

  it('answers as validate does when the structure itself is wrong', () => {
    expect(checkSpec({ widget: 'gauge', data: [1] }).issues[0].code).toBe('data-not-object');
  });
});
