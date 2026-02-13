import type { UWidgetSpec, NormalizedMapping } from '../core/types.js';
import { normalizeMapping } from '../core/normalize.js';

/**
 * Translate a u-widget spec into an ECharts option object.
 * This is a pure function with no DOM or ECharts dependency.
 *
 * Supports `options.echarts` passthrough: any key-value pairs in
 * `options.echarts` are deep-merged (one level) into the generated
 * ECharts option, allowing full customization.
 */
export function toEChartsOption(spec: UWidgetSpec): Record<string, unknown> {
  const widget = spec.widget;
  const data = spec.data;
  const mapping = spec.mapping ? normalizeMapping(spec.mapping) : undefined;
  const options = spec.options ?? {};

  if (!data) return {};

  let result: Record<string, unknown>;

  switch (widget) {
    case 'chart.bar':
      result = buildCartesian(data, mapping, 'bar', options);
      break;
    case 'chart.line':
      result = buildCartesian(data, mapping, 'line', options);
      break;
    case 'chart.area':
      result = buildCartesian(data, mapping, 'line', { ...options, _area: true });
      break;
    case 'chart.pie':
      result = buildPie(data, mapping, options);
      break;
    case 'chart.scatter':
      result = buildCartesian(data, mapping, 'scatter', options);
      break;
    case 'chart.radar':
      result = buildRadar(data, mapping, options);
      break;
    default:
      return {};
  }

  // Apply echarts passthrough: deep-merge one level
  const passthrough = options.echarts as Record<string, unknown> | undefined;
  if (passthrough && typeof passthrough === 'object') {
    result = mergeOneLevel(result, passthrough);
  }

  return result;
}

function buildCartesian(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  type: string,
  options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  const xField = mapping?.x ?? guessStringField(data);
  const yFields = mapping?.y ?? [guessNumberField(data)].filter(Boolean) as string[];

  if (!xField || yFields.length === 0) return {};

  const categories = data.map((row) => String(row[xField] ?? ''));
  const horizontal = !!options.horizontal;

  const seriesItems = yFields.map((field) => {
    const s: Record<string, unknown> = {
      name: field,
      type,
      data: data.map((row) => row[field] ?? null),
    };
    if (options._area) s.areaStyle = {};
    if (options.smooth) s.smooth = true;
    return s;
  });

  const catAxis: Record<string, unknown> = { type: 'category', data: categories };
  const valAxis: Record<string, unknown> = { type: 'value' };

  const result: Record<string, unknown> = {
    xAxis: horizontal ? valAxis : catAxis,
    yAxis: horizontal ? catAxis : valAxis,
    series: seriesItems,
    tooltip: { trigger: 'axis' },
  };

  if (yFields.length > 1) {
    result.legend = { data: yFields };
  }

  if (options.stacked) {
    (result.series as Record<string, unknown>[]).forEach((s) => {
      s.stack = 'total';
    });
  }

  return result;
}

function buildPie(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  const labelField = mapping?.label ?? guessStringField(data);
  const valueField = mapping?.value ?? guessNumberField(data);

  if (!labelField || !valueField) return {};

  const pieData = data.map((row) => ({
    name: String(row[labelField] ?? ''),
    value: Number(row[valueField] ?? 0),
  }));

  const radius = options.donut ? ['40%', '70%'] : '50%';
  const seriesItem: Record<string, unknown> = {
    type: 'pie',
    radius,
    data: pieData,
  };

  if (options.showLabel === false) {
    seriesItem.label = { show: false };
  }

  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [seriesItem],
  };
}

function buildRadar(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  _options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  const axisField = mapping?.axis ?? guessStringField(data);
  const yFields = mapping?.y ?? getNumberFields(data);

  if (!axisField || yFields.length === 0) return {};

  const indicator = data.map((row) => ({
    name: String(row[axisField] ?? ''),
  }));

  const series = yFields.map((field) => ({
    name: field,
    value: data.map((row) => Number(row[field] ?? 0)),
  }));

  return {
    tooltip: {},
    legend: { data: yFields },
    radar: { indicator },
    series: [
      {
        type: 'radar',
        data: series,
      },
    ],
  };
}

// ── Helpers ──

function guessStringField(data: Record<string, unknown>[]): string | undefined {
  if (data.length === 0) return undefined;
  const first = data[0];
  return Object.keys(first).find((k) => typeof first[k] === 'string');
}

function guessNumberField(data: Record<string, unknown>[]): string | undefined {
  if (data.length === 0) return undefined;
  const first = data[0];
  return Object.keys(first).find((k) => typeof first[k] === 'number');
}

function getNumberFields(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];
  const first = data[0];
  return Object.keys(first).filter((k) => typeof first[k] === 'number');
}

/**
 * Merge `overrides` into `base` one level deep.
 * If both base[key] and overrides[key] are plain objects, merge their properties.
 * Otherwise, overrides[key] wins.
 */
function mergeOneLevel(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    const bv = base[key];
    const ov = overrides[key];
    if (isPlainObject(bv) && isPlainObject(ov)) {
      result[key] = { ...(bv as Record<string, unknown>), ...(ov as Record<string, unknown>) };
    } else {
      result[key] = ov;
    }
  }
  return result;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}
