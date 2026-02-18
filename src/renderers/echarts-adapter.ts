import type { UWidgetSpec, NormalizedMapping } from '../core/types.js';
import { normalizeMapping } from '../core/normalize.js';

interface ReferenceLineOption {
  axis: 'x' | 'y';
  value: number | string;
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

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
      result = buildScatter(data, mapping, options);
      break;
    case 'chart.radar':
      result = buildRadar(data, mapping, options);
      break;
    case 'chart.heatmap':
      result = buildHeatmap(data, mapping, options);
      break;
    case 'chart.box':
      result = buildBoxplot(data, mapping, options);
      break;
    case 'chart.funnel':
      result = buildFunnel(data, mapping, options);
      break;
    case 'chart.waterfall':
      result = buildWaterfall(data, mapping, options);
      break;
    case 'chart.treemap':
      result = buildTreemap(data, options);
      break;
    default:
      return {};
  }

  // Apply chart-level options
  if (options.legend === false && result.legend) {
    result.legend = { ...result.legend as Record<string, unknown>, show: false };
  }

  if (options.grid === false) {
    // Hide grid lines on axes
    if (result.xAxis && typeof result.xAxis === 'object') {
      result.xAxis = { ...result.xAxis as Record<string, unknown>, splitLine: { show: false } };
    }
    if (result.yAxis && typeof result.yAxis === 'object') {
      result.yAxis = { ...result.yAxis as Record<string, unknown>, splitLine: { show: false } };
    }
  }

  if (options.animate === false) {
    result.animation = false;
  }

  if (Array.isArray(options.colors) && options.colors.length > 0) {
    result.color = options.colors;
  }

  // Apply echarts passthrough: deep-merge
  const passthrough = options.echarts as Record<string, unknown> | undefined;
  if (passthrough && typeof passthrough === 'object') {
    result = deepMerge(result, passthrough);
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
    if (options.step) s.step = options.step === true ? 'end' : options.step;
    return s;
  });

  const catAxis: Record<string, unknown> = { type: 'category', data: categories };
  const valAxis: Record<string, unknown> = { type: 'value' };

  // Histogram mode: remove gaps between bars
  if (options.histogram) {
    catAxis.axisTick = { alignWithLabel: true };
    seriesItems.forEach((s) => { s.barCategoryGap = '0%'; });
  }

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

  // Reference lines → ECharts markLine on first series
  const refLines = options.referenceLines as ReferenceLineOption[] | undefined;
  if (Array.isArray(refLines) && refLines.length > 0 && seriesItems.length > 0) {
    seriesItems[0].markLine = {
      silent: true,
      symbol: 'none',
      data: refLines.map((rl) => {
        const item: Record<string, unknown> = {};
        if (rl.axis === 'x') {
          item.xAxis = rl.value;
        } else {
          item.yAxis = rl.value;
        }
        if (rl.label) item.name = rl.label;
        const lineStyle: Record<string, unknown> = {};
        if (rl.color) lineStyle.color = rl.color;
        if (rl.style) lineStyle.type = rl.style;
        if (Object.keys(lineStyle).length > 0) item.lineStyle = lineStyle;
        if (rl.label) item.label = { formatter: rl.label, position: 'end' };
        return item;
      }),
    };
  }

  return result;
}

function buildScatter(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  // For scatter, prefer two numeric fields for x/y
  const numFields = getNumberFields(data);
  const xField = mapping?.x ?? numFields[0];
  const yField = (mapping?.y ?? [numFields[1]])[0];
  const colorField = mapping?.color;
  const sizeField = mapping?.size;

  if (!xField || !yField) return {};

  const result: Record<string, unknown> = {
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'item' },
  };

  // Helper: build a data point (2D or 3D if size mapping)
  const toPoint = (row: Record<string, unknown>): number[] => {
    const pt = [Number(row[xField] ?? 0), Number(row[yField] ?? 0)];
    if (sizeField) pt.push(Number(row[sizeField] ?? 0));
    return pt;
  };

  // symbolSize function that maps the third value to pixel radius
  const symbolSizeFn = sizeField
    ? (val: number[]) => {
        const raw = val[2] ?? 0;
        // Clamp to [4, 60] range — square root scale for area perception
        return Math.max(4, Math.min(60, Math.sqrt(raw) * 4));
      }
    : undefined;

  if (colorField) {
    // Group data by color field → separate series per group
    const groups = new Map<string, number[][]>();
    for (const row of data) {
      const key = String(row[colorField] ?? 'unknown');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(toPoint(row));
    }
    const seriesItems: Record<string, unknown>[] = [];
    for (const [name, points] of groups) {
      const series: Record<string, unknown> = { name, type: 'scatter', data: points };
      if (symbolSizeFn) series.symbolSize = symbolSizeFn;
      seriesItems.push(series);
    }
    result.series = seriesItems;
    result.legend = { data: Array.from(groups.keys()) };
  } else {
    // Single series — all points same color
    const points = data.map((row) => toPoint(row));
    const series: Record<string, unknown> = { type: 'scatter', data: points };
    if (symbolSizeFn) series.symbolSize = symbolSizeFn;
    result.series = [series];
  }

  // Reference lines
  const refLines = options.referenceLines as ReferenceLineOption[] | undefined;
  if (Array.isArray(refLines) && refLines.length > 0) {
    const firstSeries = (result.series as Record<string, unknown>[])[0];
    firstSeries.markLine = {
      silent: true,
      symbol: 'none',
      data: refLines.map((rl) => {
        const item: Record<string, unknown> = {};
        if (rl.axis === 'x') item.xAxis = rl.value;
        else item.yAxis = rl.value;
        if (rl.label) item.name = rl.label;
        const lineStyle: Record<string, unknown> = {};
        if (rl.color) lineStyle.color = rl.color;
        if (rl.style) lineStyle.type = rl.style;
        if (Object.keys(lineStyle).length > 0) item.lineStyle = lineStyle;
        if (rl.label) item.label = { formatter: rl.label, position: 'end' };
        return item;
      }),
    };
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
    label: { overflow: 'truncate', width: 80 },
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

function buildHeatmap(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  // Determine x, y (category), value (number) fields
  const first = data[0] ?? {};
  const keys = Object.keys(first);
  const stringFields = keys.filter((k) => typeof first[k] === 'string');
  const numberFields = keys.filter((k) => typeof first[k] === 'number');

  const xField = mapping?.x ?? stringFields[0];
  // For heatmap, y is a category field (string), not a numeric series
  const yField = mapping?.y?.[0] ?? stringFields.find((k) => k !== xField);
  const valueField = mapping?.value ?? numberFields[0];

  if (!xField || !yField || !valueField) return {};

  // Extract unique categories preserving order of appearance
  const xCats: string[] = [];
  const yCats: string[] = [];
  const xSet = new Set<string>();
  const ySet = new Set<string>();

  for (const row of data) {
    const x = String(row[xField] ?? '');
    const y = String(row[yField] ?? '');
    if (!xSet.has(x)) { xSet.add(x); xCats.push(x); }
    if (!ySet.has(y)) { ySet.add(y); yCats.push(y); }
  }

  // Build index maps for O(1) lookup
  const xIndex = new Map<string, number>();
  xCats.forEach((v, i) => xIndex.set(v, i));
  const yIndex = new Map<string, number>();
  yCats.forEach((v, i) => yIndex.set(v, i));

  // Build [xIndex, yIndex, value] data
  const heatData: (number | null)[][] = [];
  let minVal = Infinity;
  let maxVal = -Infinity;

  for (const row of data) {
    const xi = xIndex.get(String(row[xField] ?? '')) ?? 0;
    const yi = yIndex.get(String(row[yField] ?? '')) ?? 0;
    const v = row[valueField] != null ? Number(row[valueField]) : null;
    heatData.push([xi, yi, v]);
    if (v != null) {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
  }

  // Handle edge case of empty/no-value data
  if (!isFinite(minVal)) { minVal = 0; maxVal = 1; }

  // Determine color range from options or use defaults
  const colorRange = (options.colorRange as string[]) ?? ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027'];

  return {
    xAxis: { type: 'category', data: xCats, splitArea: { show: true } },
    yAxis: { type: 'category', data: yCats, splitArea: { show: true } },
    visualMap: {
      min: options.min != null ? Number(options.min) : minVal,
      max: options.max != null ? Number(options.max) : maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: colorRange },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: Record<string, unknown>) => {
        const d = params.data as number[];
        if (!d) return '';
        return `${xCats[d[0]]} × ${yCats[d[1]]}: ${d[2] != null ? d[2] : '-'}`;
      },
    },
    grid: { bottom: 60 },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: { show: options.showLabel !== false },
    }],
  };
}

function buildBoxplot(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  _options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data) || data.length === 0) return {};

  const first = data[0] ?? {};
  const keys = Object.keys(first);
  const stringFields = keys.filter((k) => typeof first[k] === 'string');
  const numberFields = keys.filter((k) => typeof first[k] === 'number');

  // Category field (x)
  const xField = mapping?.x ?? stringFields[0];

  // Stat fields: use mapping.y if provided (5 fields: min, q1, median, q3, max)
  // Otherwise, try well-known names, then fall back to first 5 number fields
  let statFields: string[];
  if (mapping?.y && mapping.y.length >= 5) {
    statFields = mapping.y.slice(0, 5);
  } else {
    const wellKnown = ['min', 'q1', 'median', 'q3', 'max'];
    const matched = wellKnown.filter((name) => numberFields.includes(name));
    statFields = matched.length === 5 ? matched : numberFields.slice(0, 5);
  }

  if (statFields.length < 5) return {};

  const categories = xField ? data.map((row) => String(row[xField] ?? '')) : undefined;

  const boxData = data.map((row) =>
    statFields.map((f) => Number(row[f] ?? 0)),
  );

  const result: Record<string, unknown> = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'boxplot',
      data: boxData,
    }],
  };

  if (categories) {
    result.xAxis = { type: 'category', data: categories };
    result.yAxis = { type: 'value' };
  } else {
    result.xAxis = { type: 'category' };
    result.yAxis = { type: 'value' };
  }

  return result;
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

function buildFunnel(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  _options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  const labelField = mapping?.label ?? guessStringField(data as Record<string, unknown>[]);
  const valueField = (mapping?.value ?? guessNumberField(data as Record<string, unknown>[]));

  if (!labelField || !valueField) return {};

  const seriesData = (data as Record<string, unknown>[]).map((row) => ({
    name: String(row[labelField] ?? ''),
    value: Number(row[valueField] ?? 0),
  }));

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'funnel',
      data: seriesData,
      sort: 'descending',
      gap: 2,
      label: { show: true, position: 'inside' },
    }],
  };
}

function buildWaterfall(
  data: unknown,
  mapping: NormalizedMapping | undefined,
  _options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  const records = data as Record<string, unknown>[];
  const xField = mapping?.x ?? guessStringField(records);
  const yField = (mapping?.y ?? [guessNumberField(records)])[0];

  if (!xField || !yField) return {};

  const categories: string[] = [];
  const baseValues: number[] = [];
  const positiveValues: (number | null)[] = [];
  const negativeValues: (number | null)[] = [];

  let running = 0;
  for (const row of records) {
    const label = String(row[xField] ?? '');
    const value = Number(row[yField] ?? 0);
    categories.push(label);

    if (value >= 0) {
      baseValues.push(running);
      positiveValues.push(value);
      negativeValues.push(null);
    } else {
      baseValues.push(running + value);
      positiveValues.push(null);
      negativeValues.push(Math.abs(value));
    }
    running += value;
  }

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Base',
        type: 'bar',
        stack: 'waterfall',
        itemStyle: { borderColor: 'transparent', color: 'transparent' },
        emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
        data: baseValues,
      },
      {
        name: 'Positive',
        type: 'bar',
        stack: 'waterfall',
        data: positiveValues,
      },
      {
        name: 'Negative',
        type: 'bar',
        stack: 'waterfall',
        data: negativeValues,
      },
    ],
  };
}

function buildTreemap(
  data: unknown,
  _options: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(data)) return {};

  // Treemap data uses name/value/children directly — pass through to ECharts
  const seriesData = (data as Record<string, unknown>[]).map((item) => toTreeNode(item));

  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'treemap',
      data: seriesData,
      leafDepth: 1,
      roam: false,
      label: { show: true, formatter: '{b}' },
    }],
  };
}

function toTreeNode(item: Record<string, unknown>): Record<string, unknown> {
  const node: Record<string, unknown> = {
    name: String(item.name ?? ''),
    value: Number(item.value ?? 0),
  };
  if (Array.isArray(item.children)) {
    node.children = (item.children as Record<string, unknown>[]).map((child) => toTreeNode(child));
  }
  return node;
}

function getNumberFields(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];
  const first = data[0];
  return Object.keys(first).filter((k) => typeof first[k] === 'number');
}

/**
 * Deep-merge `overrides` into `base` recursively.
 * If both base[key] and overrides[key] are plain objects, merge recursively.
 * Arrays and other values: overrides[key] wins.
 */
function deepMerge(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    const bv = base[key];
    const ov = overrides[key];
    if (isPlainObject(bv) && isPlainObject(ov)) {
      result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>);
    } else {
      result[key] = ov;
    }
  }
  return result;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}
