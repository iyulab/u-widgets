// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { checkSpec } from '../../src/core/check-spec.js';
import { help } from '../../src/core/catalog.js';
import { getWidgetOptions } from '../../src/core/widget-meta.js';
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

  it('takes a frame for any widget, as every widget reads it — and warns of a word that is not one', () => {
    const base = { widget: 'header', data: { title: 'Plant' } };
    expect(checkSpec({ ...base, options: { frame: 'block' } }).warnings).toEqual([]);
    expect(checkSpec({ ...base, options: { frame: 'none' } }).warnings).toEqual([]);
    expect(checkSpec({ widget: 'chart.line', data: [{ x: 1, y: 2 }], options: { frame: 'double' } }).warnings).toEqual([]);
    expect(checkSpec({ ...base, options: { frame: 'frilly' } }).warnings).toEqual([expect.stringContaining('options.frame "frilly" is not a frame — card, flat, glow')]);
    // other options a widget does not have still warn
    expect(checkSpec({ ...base, options: { frame: 'card', bogus: 1 } }).warnings).toEqual([expect.stringContaining('options.bogus is not an option of header')]);
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

  it('names what a chart option that is a list of settings takes — a list, and the fields each item has', () => {
    const warn = (options: Record<string, unknown>) => checkSpec({ widget: 'chart.line', data: [{ x: 'a', y: 1 }], options }).warnings;
    // the ECharts shape a reference line is often written in: none of its words are the ones a reference line takes
    expect(warn({ referenceLines: [{ type: 'line', yAxis: 20, lineStyle: { type: 'dashed' }, label: { formatter: '20' } }] })).toEqual([
      'options.referenceLines[0].type is not a field of a reference line — it takes axis, value, label, color, style',
      'options.referenceLines[0].yAxis is not a field of a reference line — it takes axis, value, label, color, style',
      'options.referenceLines[0].lineStyle is not a field of a reference line — it takes axis, value, label, color, style',
      'options.referenceLines[0].label should be a string, not {"formatter":"20"}',
    ]);
    // an object where the list goes: the chart calls a list's method on it and draws nothing
    expect(warn({ referenceLines: { y: [{ value: 20 }] } })).toEqual(['options.referenceLines should be a list of objects, not {"y":[{"value":20}]}']);
    expect(warn({ series: 'x' })).toEqual(['options.series should be a list of objects, not "x"']);
    // what a reference line takes is taken, a series' lineStyle is a word or an ECharts lineStyle object
    expect(warn({ referenceLines: [{ value: 20, label: 'Target', axis: 'y', color: '#c00', style: 'dashed' }, { value: '2026-04-06', axis: 'x' }] })).toEqual([]);
    expect(warn({ series: [{ lineStyle: 'dotted' }, { lineStyle: { type: 'dashed' }, yAxisIndex: 1 }] })).toEqual([]);
  });

  it('says the fields of a list option in the metadata the catalog and the tools read', () => {
    const referenceLines = getWidgetOptions('chart.line').find((o) => o.key === 'referenceLines')!;
    expect(referenceLines.type).toBe('object[]');
    expect(Object.keys(referenceLines.items ?? {})).toEqual(['axis', 'value', 'label', 'color', 'style']);
    expect(referenceLines.items!.axis!.enum).toEqual(['x', 'y']);
    // the description a model reads says the shape of an item, as the other list options' do
    expect(referenceLines.desc).toContain('{value, axis?');
    expect(getWidgetOptions('chart.line').find((o) => o.key === 'series')!.items).toHaveProperty('lineStyle');
    // an option that is not a list of settings carries none
    expect(getWidgetOptions('chart.line').find((o) => o.key === 'smooth')!.items).toBeUndefined();
  });

  it('answers as validate does when the structure itself is wrong', () => {
    expect(checkSpec({ widget: 'gauge', data: [1] }).issues[0].code).toBe('data-not-object');
  });
});
