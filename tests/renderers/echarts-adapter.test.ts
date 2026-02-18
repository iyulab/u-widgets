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
    it('builds scatter chart with numeric axes', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 1.5, y: 10 },
          { x: 2.5, y: 20 },
        ],
      }));
      expect((result.series as ObjArray)[0].type).toBe('scatter');
      expect((result.xAxis as Obj).type).toBe('value');
      expect((result.yAxis as Obj).type).toBe('value');
      expect((result.series as ObjArray)[0].data).toEqual([[1.5, 10], [2.5, 20]]);
    });

    it('uses explicit x/y mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { pc1: -2.68, pc2: 0.32, cluster: 0 },
          { pc1: 1.28, pc2: -0.69, cluster: 1 },
        ],
        mapping: { x: 'pc1', y: 'pc2' },
      }));
      expect((result.series as ObjArray)[0].data).toEqual([[-2.68, 0.32], [1.28, -0.69]]);
    });

    it('supports color mapping — groups into separate series', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { pc1: -2.68, pc2: 0.32, cluster: 0 },
          { pc1: -2.89, pc2: -0.11, cluster: 0 },
          { pc1: 1.28, pc2: -0.69, cluster: 1 },
          { pc1: 2.53, pc2: 0.56, cluster: 1 },
        ],
        mapping: { x: 'pc1', y: 'pc2', color: 'cluster' },
      }));
      const series = result.series as ObjArray;
      expect(series.length).toBe(2);
      expect(series[0].name).toBe('0');
      expect((series[0].data as number[][]).length).toBe(2);
      expect(series[1].name).toBe('1');
      expect((series[1].data as number[][]).length).toBe(2);
      expect(result.legend).toBeDefined();
    });

    it('supports color mapping with string categories', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 1, y: 2, label: 'normal' },
          { x: 3, y: 4, label: 'anomaly' },
        ],
        mapping: { x: 'x', y: 'y', color: 'label' },
      }));
      const series = result.series as ObjArray;
      expect(series.length).toBe(2);
      expect(series[0].name).toBe('normal');
      expect(series[1].name).toBe('anomaly');
    });

    it('supports size mapping — adds third dimension to data points', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 1, y: 10, pop: 100 },
          { x: 2, y: 20, pop: 400 },
        ],
        mapping: { x: 'x', y: 'y', size: 'pop' },
      }));
      const series = result.series as ObjArray;
      expect((series[0].data as number[][])[0]).toEqual([1, 10, 100]);
      expect((series[0].data as number[][])[1]).toEqual([2, 20, 400]);
      expect(series[0].symbolSize).toBeDefined();
    });

    it('size mapping symbolSize scales correctly', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 1, y: 10, pop: 100 },
        ],
        mapping: { x: 'x', y: 'y', size: 'pop' },
      }));
      const series = result.series as ObjArray;
      const sizeFn = series[0].symbolSize as (val: number[]) => number;
      // sqrt(100) * 4 = 40
      expect(sizeFn([1, 10, 100])).toBe(40);
    });

    it('size + color mapping works together', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 1, y: 10, pop: 100, cat: 'A' },
          { x: 2, y: 20, pop: 400, cat: 'B' },
        ],
        mapping: { x: 'x', y: 'y', size: 'pop', color: 'cat' },
      }));
      const series = result.series as ObjArray;
      expect(series.length).toBe(2);
      expect((series[0].data as number[][])[0]).toEqual([1, 10, 100]);
      expect(series[0].symbolSize).toBeDefined();
      expect(series[1].symbolSize).toBeDefined();
    });

    it('without size mapping, data points are 2D and no symbolSize', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.scatter',
        data: [
          { x: 1, y: 10 },
        ],
      }));
      const series = result.series as ObjArray;
      expect((series[0].data as number[][])[0]).toEqual([1, 10]);
      expect(series[0].symbolSize).toBeUndefined();
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

    it('deep-merges nested objects (not just one level)', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { month: 'Jan', sales: 100 },
        ],
        options: {
          echarts: {
            xAxis: { axisLabel: { color: 'red' } },
          },
        },
      }));
      // xAxis base has type + data; axisLabel is new, should be added
      expect((result.xAxis as Obj).type).toBe('category');
      expect((result.xAxis as Obj).data).toEqual(['Jan']);
      expect(((result.xAxis as Obj).axisLabel as Obj).color).toBe('red');
    });

    it('preserves nested base properties when deep-merging', () => {
      // Simulate a scenario where base has nested object, override adds to it
      const result = toEChartsOption(spec({
        widget: 'chart.line',
        data: [{ x: 'A', y: 10 }],
        options: {
          echarts: {
            tooltip: { trigger: 'item', axisPointer: { type: 'shadow' } },
          },
        },
      }));
      // base tooltip is { trigger: 'axis' }
      // override tooltip is { trigger: 'item', axisPointer: { type: 'shadow' } }
      // deep merge: trigger overridden to 'item', axisPointer added
      expect((result.tooltip as Obj).trigger).toBe('item');
      expect(((result.tooltip as Obj).axisPointer as Obj).type).toBe('shadow');
    });

    it('replaces arrays (does not merge them)', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ month: 'Jan', sales: 100 }],
        options: {
          echarts: {
            xAxis: { data: ['Override'] },
          },
        },
      }));
      // Array should be replaced, not concatenated
      expect((result.xAxis as Obj).data).toEqual(['Override']);
      expect((result.xAxis as Obj).type).toBe('category');
    });
  });

  describe('chart.heatmap', () => {
    it('builds heatmap with auto-inferred mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.heatmap',
        data: [
          { x: 'A', y: 'P', value: 0.8 },
          { x: 'A', y: 'Q', value: 0.3 },
          { x: 'B', y: 'P', value: 0.5 },
          { x: 'B', y: 'Q', value: 0.9 },
        ],
      }));
      expect((result.xAxis as Obj).data).toEqual(['A', 'B']);
      expect((result.yAxis as Obj).data).toEqual(['P', 'Q']);
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('heatmap');
      expect((series[0].data as number[][]).length).toBe(4);
      expect(result.visualMap).toBeDefined();
    });

    it('uses explicit x/y/value mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.heatmap',
        data: [
          { row: 'sepal_length', col: 'sepal_width', corr: 0.87 },
          { row: 'sepal_length', col: 'petal_length', corr: -0.43 },
        ],
        mapping: { x: 'row', y: 'col', value: 'corr' },
      }));
      expect((result.xAxis as Obj).data).toEqual(['sepal_length']);
      expect((result.yAxis as Obj).data).toEqual(['sepal_width', 'petal_length']);
      const series = result.series as ObjArray;
      const data = series[0].data as number[][];
      expect(data[0]).toEqual([0, 0, 0.87]);
      expect(data[1]).toEqual([0, 1, -0.43]);
    });

    it('auto-detects min/max for visualMap', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.heatmap',
        data: [
          { x: 'A', y: 'B', value: -1 },
          { x: 'A', y: 'C', value: 1 },
        ],
      }));
      const vm = result.visualMap as Obj;
      expect(vm.min).toBe(-1);
      expect(vm.max).toBe(1);
    });

    it('supports custom min/max/colorRange options', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.heatmap',
        data: [
          { x: 'A', y: 'B', value: 0.5 },
        ],
        options: { min: -1, max: 1, colorRange: ['blue', 'white', 'red'] },
      }));
      const vm = result.visualMap as Obj;
      expect(vm.min).toBe(-1);
      expect(vm.max).toBe(1);
      expect((vm.inRange as Obj).color).toEqual(['blue', 'white', 'red']);
    });

    it('produces correct indices for large datasets', () => {
      // Verify Map-based lookup produces correct index mapping
      const cats = ['X', 'Y', 'Z'];
      const rows = ['P', 'Q'];
      const data = [];
      for (const x of cats) {
        for (const y of rows) {
          data.push({ x, y, value: cats.indexOf(x) * 10 + rows.indexOf(y) });
        }
      }
      const result = toEChartsOption(spec({
        widget: 'chart.heatmap',
        data,
      }));
      expect((result.xAxis as Obj).data).toEqual(['X', 'Y', 'Z']);
      expect((result.yAxis as Obj).data).toEqual(['P', 'Q']);
      const heatData = (result.series as ObjArray)[0].data as number[][];
      // X=0,P=0 → value=0; X=0,Q=1 → value=1; X=1,P=0 → value=10; etc.
      expect(heatData[0]).toEqual([0, 0, 0]);
      expect(heatData[1]).toEqual([0, 1, 1]);
      expect(heatData[2]).toEqual([1, 0, 10]);
      expect(heatData[3]).toEqual([1, 1, 11]);
      expect(heatData[4]).toEqual([2, 0, 20]);
      expect(heatData[5]).toEqual([2, 1, 21]);
    });
  });

  describe('chart.box', () => {
    it('builds boxplot with well-known stat field names', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.box',
        data: [
          { group: 'A', min: 10, q1: 25, median: 35, q3: 50, max: 65 },
          { group: 'B', min: 15, q1: 30, median: 42, q3: 55, max: 70 },
        ],
      }));
      expect((result.xAxis as Obj).data).toEqual(['A', 'B']);
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('boxplot');
      expect((series[0].data as number[][])[0]).toEqual([10, 25, 35, 50, 65]);
      expect((series[0].data as number[][])[1]).toEqual([15, 30, 42, 55, 70]);
    });

    it('builds boxplot with explicit mapping', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.box',
        data: [
          { cat: 'Q1', lo: 5, p25: 20, mid: 30, p75: 45, hi: 60 },
        ],
        mapping: { x: 'cat', y: ['lo', 'p25', 'mid', 'p75', 'hi'] },
      }));
      expect((result.xAxis as Obj).data).toEqual(['Q1']);
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('boxplot');
      expect((series[0].data as number[][])[0]).toEqual([5, 20, 30, 45, 60]);
    });

    it('falls back to first 5 number fields when names do not match', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.box',
        data: [
          { label: 'X', a: 1, b: 2, c: 3, d: 4, e: 5 },
        ],
      }));
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('boxplot');
      expect((series[0].data as number[][])[0]).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns empty for fewer than 5 number fields', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.box',
        data: [{ group: 'A', a: 1, b: 2, c: 3 }],
      }));
      expect(result).toEqual({});
    });
  });

  describe('options: histogram', () => {
    it('sets barCategoryGap to 0% for histogram mode', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { bin: '0-10', count: 5 },
          { bin: '10-20', count: 12 },
          { bin: '20-30', count: 8 },
        ],
        options: { histogram: true },
      }));
      const series = result.series as ObjArray;
      expect(series[0].barCategoryGap).toBe('0%');
      expect((result.xAxis as Obj).axisTick).toEqual({ alignWithLabel: true });
    });

    it('combines with stacked option', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { bin: '0-10', male: 5, female: 3 },
          { bin: '10-20', male: 12, female: 8 },
        ],
        mapping: { x: 'bin', y: ['male', 'female'] },
        options: { histogram: true, stacked: true },
      }));
      const series = result.series as ObjArray;
      expect(series[0].barCategoryGap).toBe('0%');
      expect(series[0].stack).toBe('total');
      expect(series[1].barCategoryGap).toBe('0%');
      expect(series[1].stack).toBe('total');
    });
  });

  describe('options: referenceLines', () => {
    it('adds markLine to first series for y-axis reference', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { name: 'A', vif: 5 },
          { name: 'B', vif: 15 },
        ],
        mapping: { x: 'name', y: 'vif' },
        options: {
          referenceLines: [
            { axis: 'y', value: 10, label: 'Threshold', color: 'red', style: 'dashed' },
          ],
        },
      }));
      const series = result.series as ObjArray;
      const markLine = series[0].markLine as Obj;
      expect(markLine).toBeDefined();
      expect(markLine.silent).toBe(true);
      const mlData = markLine.data as ObjArray;
      expect(mlData.length).toBe(1);
      expect(mlData[0].yAxis).toBe(10);
      expect(mlData[0].name).toBe('Threshold');
      expect((mlData[0].lineStyle as Obj).color).toBe('red');
      expect((mlData[0].lineStyle as Obj).type).toBe('dashed');
    });

    it('supports x-axis reference lines', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
        ],
        options: {
          referenceLines: [
            { axis: 'x', value: 'A' },
          ],
        },
      }));
      const series = result.series as ObjArray;
      const mlData = (series[0].markLine as Obj).data as ObjArray;
      expect(mlData[0].xAxis).toBe('A');
    });

    it('supports multiple reference lines', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', val: 10 }],
        options: {
          referenceLines: [
            { axis: 'y', value: 5 },
            { axis: 'y', value: 15, color: 'blue' },
          ],
        },
      }));
      const series = result.series as ObjArray;
      const mlData = (series[0].markLine as Obj).data as ObjArray;
      expect(mlData.length).toBe(2);
    });
  });

  describe('options: step', () => {
    it('sets step on line series (boolean true → "end")', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.line',
        data: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
        ],
        options: { step: true },
      }));
      expect((result.series as ObjArray)[0].step).toBe('end');
    });

    it('passes string step value directly', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.line',
        data: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
        ],
        options: { step: 'middle' },
      }));
      expect((result.series as ObjArray)[0].step).toBe('middle');
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

  describe('chart.funnel', () => {
    it('builds funnel chart from label/value data', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.funnel',
        data: [
          { stage: 'Visit', count: 10000 },
          { stage: 'Signup', count: 3000 },
          { stage: 'Purchase', count: 800 },
        ],
        mapping: { label: 'stage', value: 'count' },
      }));
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('funnel');
      expect((series[0].data as ObjArray).length).toBe(3);
      expect((series[0].data as ObjArray)[0].name).toBe('Visit');
      expect((series[0].data as ObjArray)[0].value).toBe(10000);
    });

    it('auto-infers label and value fields', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.funnel',
        data: [
          { name: 'A', val: 100 },
          { name: 'B', val: 50 },
        ],
      }));
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('funnel');
      expect((series[0].data as ObjArray).length).toBe(2);
    });

    it('has legend', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.funnel',
        data: [{ stage: 'A', count: 100 }],
        mapping: { label: 'stage', value: 'count' },
      }));
      expect(result.legend).toBeDefined();
    });
  });

  describe('chart.waterfall', () => {
    it('builds waterfall chart with stacked bars', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.waterfall',
        data: [
          { item: 'Revenue', value: 500 },
          { item: 'Cost', value: -200 },
          { item: 'Marketing', value: -80 },
          { item: 'Profit', value: 220 },
        ],
        mapping: { x: 'item', y: ['value'] },
      }));
      const series = result.series as ObjArray;
      expect(series.length).toBe(3); // Base, Positive, Negative
      expect(series[0].name).toBe('Base');
      expect(series[1].name).toBe('Positive');
      expect(series[2].name).toBe('Negative');
      expect(series[0].stack).toBe('waterfall');
    });

    it('calculates base values correctly', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.waterfall',
        data: [
          { item: 'A', value: 100 },
          { item: 'B', value: -30 },
          { item: 'C', value: 50 },
        ],
        mapping: { x: 'item', y: ['value'] },
      }));
      const series = result.series as ObjArray;
      // A: +100 → base=0, running=100
      // B: -30  → base=70 (100-30), running=70
      // C: +50  → base=70, running=120
      expect(series[0].data).toEqual([0, 70, 70]);
      expect(series[1].data).toEqual([100, null, 50]);
      expect(series[2].data).toEqual([null, 30, null]);
    });

    it('has category x-axis', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.waterfall',
        data: [
          { item: 'Revenue', value: 500 },
          { item: 'Cost', value: -200 },
        ],
        mapping: { x: 'item', y: ['value'] },
      }));
      expect((result.xAxis as Obj).type).toBe('category');
      expect((result.xAxis as Obj).data).toEqual(['Revenue', 'Cost']);
    });

    it('has transparent base series', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.waterfall',
        data: [{ item: 'A', value: 100 }],
        mapping: { x: 'item', y: ['value'] },
      }));
      const base = (result.series as ObjArray)[0];
      expect((base.itemStyle as Obj).color).toBe('transparent');
    });
  });

  describe('chart.treemap', () => {
    it('builds treemap from name/value data', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.treemap',
        data: [
          { name: 'Electronics', value: 50 },
          { name: 'Clothing', value: 35 },
        ],
      }));
      const series = result.series as ObjArray;
      expect(series[0].type).toBe('treemap');
      expect((series[0].data as ObjArray).length).toBe(2);
      expect((series[0].data as ObjArray)[0].name).toBe('Electronics');
      expect((series[0].data as ObjArray)[0].value).toBe(50);
    });

    it('supports hierarchical data with children', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.treemap',
        data: [
          {
            name: 'Electronics', value: 50, children: [
              { name: 'Phones', value: 30 },
              { name: 'Laptops', value: 20 },
            ],
          },
          { name: 'Clothing', value: 35 },
        ],
      }));
      const series = result.series as ObjArray;
      const data = series[0].data as ObjArray;
      expect(data[0].children).toBeDefined();
      expect((data[0].children as ObjArray).length).toBe(2);
      expect((data[0].children as ObjArray)[0].name).toBe('Phones');
    });

    it('has tooltip', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.treemap',
        data: [{ name: 'A', value: 10 }],
      }));
      expect(result.tooltip).toBeDefined();
    });
  });

  describe('chart-level options', () => {
    it('hides legend when options.legend is false', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [
          { cat: 'A', v1: 10, v2: 20 },
        ],
        mapping: { x: 'cat', y: ['v1', 'v2'] },
        options: { legend: false },
      }));
      expect((result.legend as Obj).show).toBe(false);
    });

    it('hides grid lines when options.grid is false', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', val: 10 }],
        options: { grid: false },
      }));
      expect(((result.xAxis as Obj).splitLine as Obj)?.show).toBe(false);
      expect(((result.yAxis as Obj).splitLine as Obj)?.show).toBe(false);
    });

    it('disables animation when options.animate is false', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', val: 10 }],
        options: { animate: false },
      }));
      expect(result.animation).toBe(false);
    });

    it('applies custom colors from options.colors', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', val: 10 }],
        options: { colors },
      }));
      expect(result.color).toEqual(colors);
    });

    it('does not set animation when animate is not false', () => {
      const result = toEChartsOption(spec({
        widget: 'chart.bar',
        data: [{ cat: 'A', val: 10 }],
      }));
      expect(result.animation).toBeUndefined();
    });
  });
});
