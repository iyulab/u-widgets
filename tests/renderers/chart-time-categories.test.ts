import { describe, it, expect } from 'vitest';
import { toEChartsOption } from '../../src/renderers/echarts-adapter.js';

type Opt = { xAxis: { data: string[] }; tooltip: { valueFormatter?: (v: unknown) => string } };
const line = (x: string[], options: Record<string, unknown> = {}) =>
  toEChartsOption({ widget: 'chart.line', data: x.map((t, i) => ({ t, v: i * 1.5 })), mapping: { x: 't', y: ['v'] }, options: { locale: 'en-US', ...options } }) as unknown as Opt;

describe('chart x values that are ISO times', () => {
  it('are labelled with the time of day when every value is on one day', () => {
    const o = line(['2026-10-23T09:00:00', '2026-10-23T10:00:00', '2026-10-23T11:30:00']);
    expect(o.xAxis.data).toHaveLength(3);
    expect(o.xAxis.data.every(l => !l.includes('2026'))).toBe(true);
    expect(o.xAxis.data[2]).toMatch(/11:30/);
  });

  it('are labelled with the date when every value is a date', () => {
    const o = line(['2026-10-21', '2026-10-22', '2026-10-23']);
    expect(o.xAxis.data.every(l => !l.includes('T') && !l.includes(':'))).toBe(true);
    expect(o.xAxis.data[0]).toMatch(/21/);
  });

  it('are left as they are when the spec formats the axis itself, or when they are not all times', () => {
    expect(line(['2026-10-23T09:00:00'], { xFormat: { type: 'datetime' } }).xAxis.data).toEqual(['2026-10-23T09:00:00']);
    expect(line(['2026-10-23T09:00:00', 'later']).xAxis.data).toEqual(['2026-10-23T09:00:00', 'later']);
  });
});

describe('a value axis format', () => {
  it('is how the tooltip writes the values', () => {
    const o = line(['a', 'b'], { yFormat: { type: 'number', decimals: 2, suffix: ' kg' } });
    expect(o.tooltip.valueFormatter?.(3)).toBe('3.00 kg');
  });
});
