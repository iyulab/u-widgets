// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toEChartsOption } from '../../src/renderers/echarts-adapter.js';
import { WIDGET_OPTIONS } from '../../src/core/widget-meta.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * An option a chart lists (`WIDGET_OPTIONS`, which the tools and the rulebooks read) must change what the chart draws.
 * Each listed option is given a value the sample can show and the ECharts option it makes is compared with the one
 * without it: equal means the option is advertised and does nothing — it was `showLabel` on a bar, a radar, a funnel
 * and a treemap, written down for every chart and read by three.
 */
const ROWS = [
  { cat: 'A', val: 10, val2: 4, grp: 'g1' },
  { cat: 'B', val: 25, val2: 8, grp: 'g2' },
  { cat: 'C', val: 17, val2: 6, grp: 'g1' },
];
const SAMPLES: Record<string, { data: unknown; mapping?: unknown }> = {
  'chart.bar': { data: ROWS, mapping: { x: 'cat', y: ['val', 'val2'] } },
  'chart.line': { data: ROWS, mapping: { x: 'cat', y: ['val', 'val2'] } },
  'chart.area': { data: ROWS, mapping: { x: 'cat', y: ['val', 'val2'] } },
  'chart.scatter': { data: ROWS, mapping: { x: 'val', y: 'val2' } },
  'chart.pie': { data: ROWS, mapping: { name: 'cat', value: 'val' } },
  'chart.funnel': { data: ROWS, mapping: { name: 'cat', value: 'val' } },
  'chart.treemap': { data: [{ name: 'A', value: 3 }, { name: 'B', value: 5 }] },
  'chart.waterfall': { data: ROWS, mapping: { x: 'cat', y: 'val' } },
  'chart.heatmap': { data: ROWS, mapping: { x: 'cat', y: 'grp', value: 'val' } },
  'chart.radar': { data: ROWS, mapping: { axis: 'cat', y: ['val', 'val2'] } },
  'chart.box': { data: [{ cat: 'A', min: 1, q1: 2, median: 3, q3: 4, max: 5 }, { cat: 'B', min: 2, q1: 3, median: 5, q3: 6, max: 9 }] },
  'chart.histogram': { data: [1, 2, 2, 3, 3, 3, 4, 4, 5, 9, 9, 10, 12, 12, 13, 15, 18, 19, 22, 30] },
};
const PROBES: Record<string, unknown[]> = {
  showLabel: [true, false], legend: [true, false], grid: [true, false], animate: [true, false], smooth: [true], stack: [true],
  step: [true], horizontal: [true], histogram: [true], donut: [true], valueAxisZero: [false], xFormat: ['number:1'],
  yFormat: ['number:1'], unit: ['kg'], bins: [3], colors: [['#123456', '#abcdef']], colorRange: [['#000000', '#ffffff']],
  xAxisType: ['value'],
};
// Not compared: `chart.gantt` draws through render functions that close over its options, so two options that differ
// print the same text — its own tests (echarts-gantt) cover them. `echarts`, `series`, `referenceLines`,
// `conditionalStyles` and `categories` take a structure the sample does not hold; their tests are in echarts-adapter.
const SKIPPED_WIDGETS = new Set(['chart.gantt']);
// A legend names a chart's series: with one series there is nothing to name, so `legend` shows nothing to compare.
const SINGLE_SERIES = new Set(['chart.scatter', 'chart.heatmap', 'chart.box', 'chart.waterfall', 'chart.histogram']);
const SHOWN = (option: unknown) => JSON.stringify(option, (_key, value) => (typeof value === 'function' ? `fn:${String(value)}` : value));

describe('a chart option a widget lists changes its picture', () => {
  for (const [widget, listed] of Object.entries(WIDGET_OPTIONS)) {
    if (!widget.startsWith('chart.') || SKIPPED_WIDGETS.has(widget)) continue;
    const sample = SAMPLES[widget];
    it(`${widget}: ${listed.filter(name => PROBES[name]).join(' · ')}`, () => {
      expect(sample, `no sample for ${widget}`).toBeDefined();
      const draw = (options: Record<string, unknown>) => SHOWN(toEChartsOption({ widget, data: sample!.data, mapping: sample!.mapping, options } as unknown as UWidgetSpec));
      const base = draw({});
      const inert = listed.filter(name => PROBES[name] && !(name === 'legend' && SINGLE_SERIES.has(widget)) && PROBES[name]!.every(value => draw({ [name]: value }) === base));
      expect(inert, `${widget} lists options that change nothing`).toEqual([]);
    });
  }
});
