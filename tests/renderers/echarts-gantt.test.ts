// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toEChartsOption } from '../../src/renderers/echarts-adapter.js';
import type { UWidgetSpec } from '../../src/core/types.js';

type Obj = Record<string, unknown>;
type ObjArray = Record<string, unknown>[];

function gantt(overrides: Partial<UWidgetSpec>): Obj {
  return toEChartsOption({ widget: 'chart.gantt', ...overrides } as UWidgetSpec);
}

/** A fake renderItem api: one x unit = 10px, one category band = 40px (row i centred at 40i + 20). */
function fakeApi(value: unknown[], color = '#123456') {
  return {
    value: (i: number) => value[i],
    coord: ([x, y]: [number, number]) => [x * 10, y * 40 + 20],
    size: ([dx, dy]: [number, number]) => [dx * 10, dy * 40],
    visual: (key: string) => (key === 'color' ? color : undefined),
  };
}

function render(series: Obj, dataIndex: number): Obj {
  const item = (series.data as ObjArray)[dataIndex];
  const renderItem = series.renderItem as (p: Obj, api: unknown) => Obj;
  return renderItem({ dataIndex }, fakeApi(item.value as unknown[]));
}

const SCHEDULE = [
  { machine: 'M2', job: 'J1', start: 0, end: 3 },
  { machine: 'M1', job: 'J2', start: 1, end: 4 },
  { machine: 'M2', job: 'J3', start: 3, end: 7 },
];

describe('chart.gantt', () => {
  it('draws one custom series of [row, start, end] intervals on a value axis', () => {
    const result = gantt({ data: SCHEDULE, mapping: { y: 'machine', start: 'start', end: 'end', label: 'job' } });
    const series = result.series as ObjArray;
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('custom');
    expect((series[0].data as ObjArray).map((d) => d.value)).toEqual([[0, 0, 3], [1, 1, 4], [0, 3, 7]]);
    expect(series[0].encode).toEqual({ x: [1, 2], y: 0 });
    expect((result.xAxis as Obj).type).toBe('value');
  });

  it('keeps rows top-to-bottom in first-appearance order — one inversion, not two', () => {
    const result = gantt({ data: SCHEDULE, mapping: { y: 'machine', start: 'start', end: 'end' } });
    const yAxis = result.yAxis as Obj;
    expect(yAxis.type).toBe('category');
    expect(yAxis.data).toEqual(['M2', 'M1']);
    expect(yAxis.inverse).toBe(true);
    // Row index in the data matches the axis position of its own category.
    const series = (result.series as ObjArray)[0];
    const values = (series.data as ObjArray).map((d) => d.value as number[]);
    SCHEDULE.forEach((row, i) => expect((yAxis.data as string[])[values[i][0]]).toBe(row.machine));
  });

  it('options.categories fixes the row order and keeps rows that have no intervals', () => {
    const result = gantt({
      data: SCHEDULE,
      mapping: { y: 'machine', start: 'start', end: 'end' },
      options: { categories: ['M1', 'M3'] },
    });
    // M3 has no interval but still shows; M2 is not listed and is appended in data order.
    expect((result.yAxis as Obj).data).toEqual(['M1', 'M3', 'M2']);
    const values = ((result.series as ObjArray)[0].data as ObjArray).map((d) => (d.value as number[])[0]);
    expect(values).toEqual([2, 0, 2]);
  });

  it('keeps overlapping intervals in one row as separate items on the same row', () => {
    const result = gantt({
      data: [{ r: 'A', s: 0, e: 5 }, { r: 'A', s: 2, e: 6 }],
      mapping: { y: 'r', start: 's', end: 'e' },
    });
    const values = ((result.series as ObjArray)[0].data as ObjArray).map((d) => d.value);
    expect(values).toEqual([[0, 0, 5], [0, 2, 6]]);
  });

  it('draws a zero-length interval as a visible sliver, not nothing', () => {
    const result = gantt({ data: [{ r: 'A', s: 4, e: 4 }], mapping: { y: 'r', start: 's', end: 'e' } });
    const shape = render((result.series as ObjArray)[0], 0).shape as Obj;
    expect(shape.width as number).toBeGreaterThanOrEqual(2);
    expect((shape.x as number) + (shape.width as number) / 2).toBeCloseTo(40, 5);
  });

  it('separates adjacent segments with a gap instead of letting them touch', () => {
    const result = gantt({ data: SCHEDULE, mapping: { y: 'machine', start: 'start', end: 'end' } });
    const series = (result.series as ObjArray)[0];
    const first = render(series, 0).shape as Obj; // M2 0→3
    const next = render(series, 2).shape as Obj; // M2 3→7
    expect((first.x as number) + (first.width as number)).toBeLessThan(next.x as number);
  });

  it('labels a segment inside the bar when mapped, truncated to the bar width', () => {
    const result = gantt({ data: SCHEDULE, mapping: { y: 'machine', start: 'start', end: 'end', label: 'job' } });
    const el = render((result.series as ObjArray)[0], 2);
    const text = el.textContent as Obj;
    expect((text.style as Obj).text).toBe('J3');
    expect((text.style as Obj).overflow).toBe('truncate');
    expect((text.style as Obj).width as number).toBeLessThan((el.shape as Obj).width as number);
  });

  it('omits the in-bar label when the bar is too narrow or showLabel is false', () => {
    const narrow = gantt({ data: [{ r: 'A', job: 'J1', s: 0, e: 1 }], mapping: { y: 'r', start: 's', end: 'e', label: 'job' } });
    expect(render((narrow.series as ObjArray)[0], 0).textContent).toBeUndefined();
    const off = gantt({ data: SCHEDULE, mapping: { y: 'machine', start: 'start', end: 'end', label: 'job' }, options: { showLabel: false } });
    expect(render((off.series as ObjArray)[0], 2).textContent).toBeUndefined();
  });

  it('mapping.color splits intervals into one series per group with a legend', () => {
    const result = gantt({
      data: [
        { r: 'M1', job: 'J1', s: 0, e: 2 },
        { r: 'M2', job: 'J2', s: 0, e: 3 },
        { r: 'M1', job: 'J2', s: 3, e: 8 },
      ],
      mapping: { y: 'r', start: 's', end: 'e', label: 'job', color: 'job' },
    });
    const series = result.series as ObjArray;
    expect(series.map((s) => s.name)).toEqual(['J1', 'J2']);
    expect((series[1].data as ObjArray).map((d) => d.value)).toEqual([[1, 0, 3], [0, 3, 8]]);
    expect((result.legend as Obj).data).toEqual(['J1', 'J2']);
    // Labels follow each series' own items.
    expect(((render(series[1], 1).textContent as Obj).style as Obj).text).toBe('J2');
  });

  it('uses a time axis when start/end are date strings', () => {
    const result = gantt({
      data: [{ task: 'Design', from: '2026-01-01', to: '2026-01-10' }],
      mapping: { y: 'task', start: 'from', end: 'to' },
    });
    expect((result.xAxis as Obj).type).toBe('time');
    expect(((result.xAxis as Obj).axisLabel as Obj).hideOverlap).toBe(true);
    const value = ((result.series as ObjArray)[0].data as ObjArray)[0].value as number[];
    expect(value).toEqual([0, Date.parse('2026-01-01'), Date.parse('2026-01-10')]);
  });

  it('draws referenceLines on the value/time axis at their data value', () => {
    const num = gantt({
      data: SCHEDULE,
      mapping: { y: 'machine', start: 'start', end: 'end' },
      options: { referenceLines: [{ axis: 'x', value: 7, label: 'Makespan' }] },
    });
    const markLine = (num.series as ObjArray)[0].markLine as Obj;
    expect((markLine.data as ObjArray)[0].xAxis).toBe(7);
    expect((markLine.data as ObjArray)[0].name).toBe('Makespan');

    const time = gantt({
      data: [{ task: 'Design', from: '2026-01-01', to: '2026-01-10' }],
      mapping: { y: 'task', start: 'from', end: 'to' },
      options: { referenceLines: [{ axis: 'x', value: '2026-01-05', label: 'Due' }] },
    });
    expect((((time.series as ObjArray)[0].markLine as Obj).data as ObjArray)[0].xAxis).toBe(Date.parse('2026-01-05'));
  });

  it('infers the mapping: first string → row, first two numbers → start/end, next string → label', () => {
    const result = gantt({ data: SCHEDULE });
    expect((result.yAxis as Obj).data).toEqual(['M2', 'M1']);
    const series = (result.series as ObjArray)[0];
    expect(((render(series, 0).textContent as Obj).style as Obj).text).toBe('J1');
  });

  it('skips rows without a finite start/end and draws end-before-start in order', () => {
    const result = gantt({
      data: [{ r: 'A', s: 5, e: 2 }, { r: 'B', s: null, e: 3 }, { r: 'C', s: 'x', e: 1 }],
      mapping: { y: 'r', start: 's', end: 'e' },
    });
    expect(((result.series as ObjArray)[0].data as ObjArray).map((d) => d.value)).toEqual([[0, 2, 5]]);
    // Rows are still listed — a row whose only interval is invalid is not silently dropped from the axis.
    expect((result.yAxis as Obj).data).toEqual(['A', 'B', 'C']);
  });

  it('tooltip shows row, label and start → end, with data text escaped', () => {
    const result = gantt({
      data: [{ r: '<b>M1</b>', job: 'J&1', s: 0, e: 3 }],
      mapping: { y: 'r', start: 's', end: 'e', label: 'job' },
    });
    const tooltip = result.tooltip as Obj;
    expect(tooltip.trigger).toBe('item');
    const series = (result.series as ObjArray)[0];
    const item = (series.data as ObjArray)[0];
    const html = (tooltip.formatter as (p: Obj) => string)({ seriesIndex: 0, dataIndex: 0, value: item.value, data: item });
    expect(html).toContain('&lt;b&gt;M1&lt;/b&gt;');
    expect(html).toContain('J&amp;1');
    expect(html).toContain('0 → 3');
  });

  it('xFormat date labels a time axis tick by its local calendar day, not a raw millisecond count', () => {
    const result = gantt({
      data: [{ task: 'Design', from: '2026-03-02', to: '2026-03-13' }],
      mapping: { y: 'task', start: 'from', end: 'to' },
      options: { xFormat: { type: 'date' } },
    });
    const formatter = ((result.xAxis as Obj).axisLabel as Obj).formatter as (v: number) => string;
    // ECharts places day ticks at local midnight — east of UTC that is the previous day in UTC.
    expect(formatter(new Date(2026, 2, 2).getTime())).toBe('2026-03-02');
    const tooltip = (result.tooltip as Obj).formatter as (p: Obj) => string;
    expect(tooltip({ seriesIndex: 0, dataIndex: 0 })).toContain('2026-03-02 → 2026-03-13');
  });

  it('puts an x reference line label at the top — the row axis is inverted, so its start is the top', () => {
    const result = gantt({
      data: SCHEDULE,
      mapping: { y: 'machine', start: 'start', end: 'end' },
      options: { referenceLines: [{ axis: 'x', value: 7, label: 'Makespan' }] },
    });
    const item = (((result.series as ObjArray)[0].markLine as Obj).data as ObjArray)[0];
    expect((item.label as Obj).position).toBe('start');
  });

  it('tags each segment with its spec.data row, across color groups and skipped rows', () => {
    const result = gantt({
      data: [
        { r: 'M1', job: 'J1', s: 0, e: 2 },
        { r: 'M2', job: 'J2', s: null, e: 3 },
        { r: 'M2', job: 'J2', s: 0, e: 3 },
        { r: 'M1', job: 'J1', s: 3, e: 5 },
      ],
      mapping: { y: 'r', start: 's', end: 'e', color: 'job' },
    });
    const series = result.series as ObjArray;
    expect((series[0].data as ObjArray).map((d) => d.rowIndex)).toEqual([0, 3]);
    expect((series[1].data as ObjArray).map((d) => d.rowIndex)).toEqual([2]);
  });

  it('returns an empty option when no row or interval fields can be found', () => {
    expect(gantt({ data: [{ a: 'x' }] })).toEqual({});
  });
});
