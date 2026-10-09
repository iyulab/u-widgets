// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toEChartsOption, chartLayoutKey } from '../../src/renderers/echarts-adapter.js';
import type { UWidgetSpec } from '../../src/core/types.js';

type Obj = Record<string, unknown>;

const twoSeries: UWidgetSpec = {
  widget: 'chart.line',
  data: [
    { day: 'Mon', cpu: 40, mem: 60 },
    { day: 'Tue', cpu: 55, mem: 58 },
  ],
  mapping: { x: 'day', y: ['cpu', 'mem'] },
} as UWidgetSpec;

const pie: UWidgetSpec = {
  widget: 'chart.pie',
  data: [
    { name: 'A', value: 3 },
    { name: 'B', value: 1 },
  ],
} as UWidgetSpec;

describe('chartLayoutKey', () => {
  it('asks for no compact layout without a size, at zero size, or on a roomy canvas', () => {
    expect(chartLayoutKey(undefined)).toBe('');
    expect(chartLayoutKey({ width: 0, height: 0 })).toBe('');
    expect(chartLayoutKey({ width: 600, height: 300 })).toBe('');
  });

  it('asks for a compact layout when either side is small', () => {
    expect(chartLayoutKey({ width: 160, height: 140 })).not.toBe('');
    expect(chartLayoutKey({ width: 600, height: 200 })).not.toBe('');
    expect(chartLayoutKey({ width: 300, height: 300 })).not.toBe('');
  });

  it('changes only when the layout would change', () => {
    expect(chartLayoutKey({ width: 160, height: 150 })).toBe(chartLayoutKey({ width: 170, height: 145 }));
    expect(chartLayoutKey({ width: 160, height: 150 })).not.toBe(chartLayoutKey({ width: 160, height: 130 }));
  });
});

describe('toEChartsOption — compact layout', () => {
  it('leaves a roomy canvas exactly as without a size', () => {
    expect(toEChartsOption(twoSeries, { width: 600, height: 300 })).toEqual(toEChartsOption(twoSeries));
  });

  it('fits the axis labels inside tight margins and thins the value ticks', () => {
    const o = toEChartsOption(twoSeries, { width: 160, height: 150 });
    expect(o.grid).toMatchObject({ top: 28, bottom: 8, left: 8, right: 12, outerBoundsMode: 'same', outerBoundsContain: 'all' });
    expect(o.yAxis).toMatchObject({ splitNumber: 2, axisLabel: { hideOverlap: true } });
    expect(o.xAxis).toMatchObject({ type: 'category', axisLabel: { hideOverlap: true } });
    expect(o.legend).toMatchObject({ top: 0, itemWidth: 12 });
  });

  it('drops the legend when the canvas is too short for it', () => {
    const o = toEChartsOption(twoSeries, { width: 300, height: 120 });
    expect((o.legend as Obj).show).toBe(false);
    expect((o.grid as Obj).top).toBe(12);
  });

  it('keeps a spec’s own options.echarts layout over the compact one', () => {
    const o = toEChartsOption(
      { ...twoSeries, options: { echarts: { grid: { top: 40 }, legend: { show: true } } } } as UWidgetSpec,
      { width: 300, height: 120 },
    );
    expect((o.grid as Obj).top).toBe(40);
    expect((o.legend as Obj).show).toBe(true);
  });

  it('moves pie labels off the outside of a small pie and hides a legend with no room beside it', () => {
    const o = toEChartsOption(pie, { width: 160, height: 140 });
    const s = (o.series as Obj[])[0];
    expect(s.label).toEqual({ show: false });
    expect(s.labelLine).toEqual({ show: false });
    expect((o.legend as Obj).show).toBe(false);
    expect(s.center).toEqual(['50%', '50%']);
  });

  it('keeps a side legend on a wide, short pie and shifts the pie to make room', () => {
    const o = toEChartsOption(pie, { width: 300, height: 180 });
    expect(o.legend).toMatchObject({ orient: 'vertical', left: 4, top: 'middle' });
    expect((o.series as Obj[])[0].center).toEqual(['64%', '50%']);
  });

  it('leaves pie labels alone when the spec already turned them off', () => {
    const o = toEChartsOption({ ...pie, options: { showLabel: false } } as UWidgetSpec, { width: 160, height: 140 });
    expect((o.series as Obj[])[0].label).toEqual({ show: false });
    expect((o.series as Obj[])[0].labelLine).toBeUndefined();
  });

  it('hides a heatmap’s colour scale rather than let it take the plot', () => {
    const o = toEChartsOption(
      {
        widget: 'chart.heatmap',
        data: [{ x: 'a', y: 'b', value: 1 }],
        mapping: { x: 'x', y: 'y', value: 'value' },
      } as UWidgetSpec,
      { width: 160, height: 140 },
    );
    expect((o.visualMap as Obj).show).toBe(false);
    expect((o.grid as Obj).bottom).toBe(8);
  });
});
