import { describe, it, expect } from 'vitest';
import { toEChartsOption } from '../../src/renderers/echarts-adapter.js';
import type { UWidgetSpec } from '../../src/core/types.js';

type Obj = Record<string, unknown>;
type ObjArray = Record<string, unknown>[];

function spec(overrides: Partial<UWidgetSpec>): UWidgetSpec {
  return { widget: 'chart.bar', ...overrides } as UWidgetSpec;
}

describe('toEChartsOption', () => {
  describe('chart.bar', () => {
    it('builds bar chart with auto-inferred mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { month: 'Jan', sales: 100 },
          { month: 'Feb', sales: 200 },
        ],
      }));
      expect((result.xAxis as Obj).data).toEqual(['Jan', 'Feb']);
      expect((result.series as ObjArray)[0].type).toBe('bar');
      expect((result.series as ObjArray)[0].data).toEqual([100, 200]);
    });

    it('uses explicit mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { name: 'A', count: 10, total: 50 },
          { name: 'B', count: 20, total: 100 },
        ],
        mapping: { x: 'name', y: ['count', 'total'] },
      }));
      const series = result.series as ObjArray;
      expect(series.length).toBe(2);
      expect(series[0].name).toBe('count');
      expect(series[1].name).toBe('total');
      expect(result.legend).toBeDefined();
    });

    it('supports stacked option', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', v1: 10, v2: 20 }],
        mapping: { x: 'cat', y: ['v1', 'v2'] },
        options: { stacked: true },
      }));
      const series = result.series as ObjArray;
      expect(series[0].stack).toBe('total');
      expect(series[1].stack).toBe('total');
    });
  });

  describe('chart.line', () => {
    it('builds line chart', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.line',
        data: [
          { x: 'Mon', y: 10 },
          { x: 'Tue', y: 20 },
        ],
      }));
      expect((result.series as ObjArray)[0].type).toBe('line');
    });
  });

  describe('chart.area', () => {
    it('builds area chart (line with areaStyle)', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.area',
        data: [
          { x: 'Mon', y: 10 },
          { x: 'Tue', y: 20 },
        ],
      }));
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('line');
      expect(series[0].areaStyle).toBeDefined();
    });
  });

  describe('chart.pie', () => {
    it('builds pie chart', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.pie',
        data: [
          { category: 'Desktop', count: 60 },
          { category: 'Mobile', count: 30 },
          { category: 'Tablet', count: 10 },
        ],
      }));
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('pie');
      expect((series[0].data as ObjArray).length).toBe(3);
      expect((series[0].data as ObjArray)[0].name).toBe('Desktop');
      expect((series[0].data as ObjArray)[0].value).toBe(60);
    });

    it('uses explicit label/value mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.pie',
        data: [
          { name: 'A', amount: 100 },
          { name: 'B', amount: 200 },
        ],
        mapping: { label: 'name', value: 'amount' },
      }));
      const series = result.series as ObjArray;
      expect((series[0].data as ObjArray)[0].name).toBe('A');
      expect((series[0].data as ObjArray)[0].value).toBe(100);
    });
  });

  describe('chart.scatter', () => {
    it('builds scatter chart', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
        ],
      }));
      expect((result.series as ObjArray)[0].type).toBe('scatter');
    });
  });

  describe('chart.radar', () => {
    it('builds radar chart', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.radar',
        data: [
          { metric: 'Speed', score: 90 },
          { metric: 'Power', score: 75 },
          { metric: 'Defense', score: 60 },
        ],
        mapping: { axis: 'metric', y: ['score'] },
      }));
      expect(((result.radar as Obj).indicator as ObjArray).length).toBe(3);
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('radar');
      expect(((series[0].data as ObjArray)[0] as Obj).value).toEqual([90, 75, 60]);
    });
  });

  describe('options: horizontal', () => {
    it('swaps axes for horizontal bar chart', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { cat: 'A', val: 10 },
          { cat: 'B', val: 20 },
        ],
        options: { horizontal: true },
      }));
      expect((result.yAxis as Obj).type).toBe('category');
      expect((result.yAxis as Obj).data).toEqual(['A', 'B']);
      expect((result.xAxis as Obj).type).toBe('value');
    });
  });

  describe('options: smooth', () => {
    it('sets smooth on line series', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.line',
        data: [
          { x: 'Mon', y: 10 },
          { x: 'Tue', y: 20 },
        ],
        options: { smooth: true },
      }));
      expect((result.series as ObjArray)[0].smooth).toBe(true);
    });
  });

  describe('options: donut', () => {
    it('creates donut pie chart with inner radius', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.pie',
        data: [
          { cat: 'A', val: 60 },
          { cat: 'B', val: 40 },
        ],
        options: { donut: true },
      }));
      const series = result.series as ObjArray;
      expect(series[0].radius).toEqual(['40%', '70%']);
    });
  });

  describe('options: showLabel', () => {
    it('hides pie labels when showLabel is false', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.pie',
        data: [
          { cat: 'A', val: 60 },
          { cat: 'B', val: 40 },
        ],
        options: { showLabel: false },
      }));
      const series = result.series as ObjArray;
      expect(series[0].label).toEqual({ show: false });
    });
  });

  describe('options: echarts passthrough', () => {
    it('merges echarts overrides one level deep', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { month: 'Jan', sales: 100 },
        ],
        options: {
          echarts: {
            xAxis: { name: 'Month' },
            yAxis: { name: 'Sales ($)' },
            title: { text: 'Monthly Sales' },
          },
        },
      }));
      // Original xAxis properties preserved, name added
      expect((result.xAxis as Obj).type).toBe('category');
      expect((result.xAxis as Obj).data).toEqual(['Jan']);
      expect((result.xAxis as Obj).name).toBe('Month');
      // yAxis merged
      expect((result.yAxis as Obj).type).toBe('value');
      expect((result.yAxis as Obj).name).toBe('Sales ($)');
      // New top-level key added
      expect((result.title as Obj).text).toBe('Monthly Sales');
    });

    it('overrides non-object values', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { month: 'Jan', sales: 100 },
        ],
        options: {
          echarts: {
            tooltip: false,
          },
        },
      }));
      expect(result.tooltip).toBe(false);
    });

    it('combines with other options like stacked', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', v1: 10, v2: 20 }],
        mapping: { x: 'cat', y: ['v1', 'v2'] },
        options: {
          stacked: true,
          echarts: {
            legend: { orient: 'horizontal', top: 'bottom' },
          },
        },
      }));
      const series = result.series as ObjArray;
      expect(series[0].stack).toBe('total');
      // legend merged: data from auto + orient/top from passthrough
      expect((result.legend as Obj).data).toEqual(['v1', 'v2']);
      expect((result.legend as Obj).orient).toBe('horizontal');
      expect((result.legend as Obj).top).toBe('bottom');
    });
  });

  describe('edge cases', () => {
    it('returns empty object for missing data', () => {
      const result = toEChartsOption(spec({ widget: 'chart.bar' }));
      expect(result).toEqual({});
    });

    it('returns empty object for non-array data', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: { value: 42 },
      }));
      expect(result).toEqual({});
    });

    it('returns empty object for unknown chart type', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.unknown' as UWidgetSpec['widget'],
        data: [{ x: 1 }],
      }));
      expect(result).toEqual({});
    });
  });
});
