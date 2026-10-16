// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toEChartsOption } from '../../src/renderers/echarts-adapter.js';
import type { UWidgetSpec } from '../../src/core/types.js';

type Obj = Record<string, unknown>;
type Fmt = (v: unknown) => unknown;

function option(s: Partial<UWidgetSpec>, widget = 'chart.line'): Obj {
  return toEChartsOption({ widget, ...s } as UWidgetSpec) as Obj;
}
const axisFmt = (axis: unknown): Fmt => ((axis as Obj).axisLabel as Obj).formatter as Fmt;
const data = [{ t: 0, a: 2.5 }, { t: 1, a: 50000 }, { t: 2, a: 0.25 }];
const mapping = { x: 't', y: 'a' };

describe('value axes and tooltips read numbers in the widget locale', () => {
  it('a value axis without a format writes German grouping and decimals', () => {
    const fmt = axisFmt(option({ data, mapping, options: { locale: 'de' } }).yAxis);
    expect(fmt(50000)).toBe('50.000');
    expect(fmt(2.5)).toBe('2,5');
    expect(fmt(0.25)).toBe('0,25');
    expect(fmt(0.0001)).toBe('0,0001');
  });

  it('en keeps the familiar notation', () => {
    const fmt = axisFmt(option({ data, mapping, options: { locale: 'en' } }).yAxis);
    expect(fmt(50000)).toBe('50,000');
    expect(fmt(2.5)).toBe('2.5');
  });

  it('a category axis is left alone', () => {
    const x = option({ data, mapping, options: { locale: 'de' } }).xAxis as Obj;
    expect(x.type).toBe('category');
    expect((x.axisLabel as Obj | undefined)?.formatter).toBeUndefined();
  });

  it('a value x axis gets it too', () => {
    const fmt = axisFmt(option({ data, mapping, options: { locale: 'de', xAxisType: 'value' } }).xAxis);
    expect(fmt(1.5)).toBe('1,5');
  });

  it('a horizontal bar formats its value axis (x)', () => {
    const o = option({ data, mapping, options: { locale: 'de', horizontal: true } }, 'chart.bar');
    expect(axisFmt(o.xAxis)(2.5)).toBe('2,5');
  });

  it('yFormat still decides', () => {
    const fmt = axisFmt(option({ data, mapping, options: { locale: 'de', yFormat: { type: 'percent' } } }).yAxis);
    expect(fmt(50)).toBe('50%');
  });

  it('a formatter from options.echarts wins', () => {
    const own = (v: number) => `v${v}`;
    const y = option({ data, mapping, options: { locale: 'de', echarts: { yAxis: { axisLabel: { formatter: own } } } } }).yAxis;
    expect(axisFmt(y)).toBe(own);
  });

  it('the tooltip value is in the locale', () => {
    const vf = (option({ data, mapping, options: { locale: 'de' } }).tooltip as Obj).valueFormatter as Fmt;
    expect(vf(50000)).toBe('50.000');
    expect(vf([1.5, 2])).toEqual(['1,5', '2']);
    expect(vf(null)).toBe('-');
  });

  it('a pie slice value is in the locale', () => {
    const o = option({ data: [{ k: 'a', v: 1234.5 }], mapping: { label: 'k', value: 'v' }, options: { locale: 'de' } }, 'chart.pie');
    expect(((o.tooltip as Obj).valueFormatter as Fmt)(1234.5)).toBe('1.234,5');
  });

  it('a heatmap tooltip escapes category names and writes the value in the locale', () => {
    const o = option({ data: [{ x: '<img src=x onerror=alert(1)>', y: 'b', v: 1234.5 }], mapping: { x: 'x', y: 'y', value: 'v' }, options: { locale: 'de' } }, 'chart.heatmap');
    const text = ((o.tooltip as Obj).formatter as Fmt)({ data: [0, 0, 1234.5] }) as string;
    expect(text).toBe('&lt;img src=x onerror=alert(1)&gt; × b: 1.234,5');
  });

  it('a tooltip formatter set by the builder is kept', () => {
    const o = option({ data: [{ x: 'a', y: 'b', v: 1 }], mapping: { x: 'x', y: 'y', value: 'v' }, options: { locale: 'de' } }, 'chart.heatmap');
    const tooltip = o.tooltip as Obj;
    expect(typeof tooltip.formatter).toBe('function');
    expect(tooltip.valueFormatter).toBeUndefined();
  });
});
