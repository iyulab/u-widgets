// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isColumnar, columnsToRows, flattenRow, toRows } from '../../src/core/tabular.js';
import { normalize } from '../../src/core/normalize.js';
import { validate, specErrorMessage } from '../../src/core/schema.js';
import { infer } from '../../src/core/infer.js';
import { suggestMapping } from '../../src/core/suggest-mapping.js';
import { getLocaleStrings } from '../../src/core/locale.js';
import '../../src/locales/ko.js';

// A time series as weather APIs answer it: one array per field.
const hourly = { time: ['00:00', '01:00', '02:00'], temperature: [15.5, 17.5, 19.6] };
// Features as GeoJSON carries them: fields grouped under `properties`.
const features = [
  { type: 'Feature', id: 'a', properties: { mag: 4.8, place: 'Off the coast' }, geometry: { type: 'Point', coordinates: [140.1, 35.2] } },
  { type: 'Feature', id: 'b', properties: { mag: 5.1, place: 'Inland' }, geometry: { type: 'Point', coordinates: [120.5, 23.9] } },
];

describe('columns', () => {
  it('recognizes an object of equal-length arrays', () => {
    expect(isColumnar(hourly)).toBe(true);
    expect(isColumnar({ a: [1, 2], b: [3] })).toBe(false); // lengths differ
    expect(isColumnar({ a: [1, 2], unit: '°C' })).toBe(false); // not every value is an array
    expect(isColumnar({})).toBe(false);
    expect(isColumnar({ items: [{ label: 'A', value: 1 }] })).toBe(false); // records wrapped in an object
    expect(isColumnar([1, 2])).toBe(false);
  });

  it('reads one row per index', () => {
    expect(columnsToRows(hourly)).toEqual([
      { time: '00:00', temperature: 15.5 },
      { time: '01:00', temperature: 17.5 },
      { time: '02:00', temperature: 19.6 },
    ]);
  });
});

describe('nested rows', () => {
  it('spreads nested objects into dotted keys and keeps arrays as values', () => {
    expect(flattenRow(features[0])).toEqual({
      type: 'Feature',
      id: 'a',
      'properties.mag': 4.8,
      'properties.place': 'Off the coast',
      'geometry.type': 'Point',
      'geometry.coordinates': [140.1, 35.2],
    });
  });

  it('keeps a key the row already has over a flattened one', () => {
    expect(flattenRow({ 'a.b': 'literal', a: { b: 'nested' } })).toEqual({ 'a.b': 'literal' });
  });

  it('returns a flat row as it is', () => {
    const row = { name: 'A', value: 1 };
    expect(flattenRow(row)).toBe(row);
  });
});

describe('toRows', () => {
  it('turns columns into rows for a widget that takes an array', () => {
    expect(toRows('chart.line', hourly)).toEqual(columnsToRows(hourly));
    expect(toRows('list', hourly)).toEqual(columnsToRows(hourly));
  });

  it('leaves the data of a widget that takes an object alone', () => {
    const data = { value: [1, 2, 3] };
    expect(toRows('metric', data)).toBe(data);
  });

  it('flattens nested rows only for charts and tables', () => {
    expect((toRows('table', features) as Record<string, unknown>[])[1]['properties.mag']).toBe(5.1);
    expect((toRows('chart.bar', features) as Record<string, unknown>[])[0]['properties.place']).toBe('Off the coast');
    expect(toRows('gallery', features)).toBe(features);
  });
});

describe('a widget spec over these shapes', () => {
  it('validates columns as a chart’s data and checks its mapping against the column names', () => {
    const result = validate({ widget: 'chart.line', data: hourly, mapping: { x: 'time', y: 'temperature' } });
    expect(result).toEqual({ valid: true, errors: [], issues: [], warnings: [] });
  });

  it('checks a dotted mapping against nested rows without a false warning', () => {
    expect(validate({ widget: 'chart.bar', data: features, mapping: { x: 'properties.place', y: 'properties.mag' } }).warnings).toEqual([]);
    expect(validate({ widget: 'chart.bar', data: features, mapping: { x: 'properties.nope' } }).warnings).toHaveLength(1);
  });

  it('normalizes to rows the renderers read', () => {
    expect(normalize({ widget: 'chart.line', data: hourly }).data).toEqual(columnsToRows(hourly));
  });

  it('infers a mapping from columns and nested rows', () => {
    expect(infer('chart.line', hourly)).toMatchObject({ x: 'time', y: 'temperature' });
    expect(infer('chart.bar', features)).toMatchObject({ y: 'properties.mag' });
    expect(suggestMapping(hourly)[0]?.widget).toMatch(/^chart\./);
  });
});

describe('validation errors as data', () => {
  it('still rejects an object that is not columns, with the English message and its issue', () => {
    const result = validate({ widget: 'chart.line', data: { time: ['00:00'], unit: '°C' } });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['"chart.line" expects "data" to be an array, got object']);
    expect(result.issues).toEqual([{ code: 'data-not-array', params: { widget: 'chart.line', got: 'object' }, path: [] }]);
  });

  it('places a compose child’s issue under its path', () => {
    const result = validate({ widget: 'compose', children: [{ widget: 'metric', data: [1] }] });
    expect(result.issues).toEqual([{ code: 'data-not-object', params: { widget: 'metric', got: 'array' }, path: ['children[0]'] }]);
    expect(result.errors).toEqual(['children[0]: "metric" expects "data" to be an object, got array']);
  });

  it('reads each issue in the locale it is shown in', () => {
    const [issue] = validate({ widget: 'chart.line', data: 'x' }).issues;
    expect(specErrorMessage(issue, getLocaleStrings('ko'))).toBe('"chart.line"의 "data"는 배열이어야 하는데 받은 값은 string입니다');
  });
});
