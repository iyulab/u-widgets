/**
 * Row-shaped data from the other shapes a data source commonly answers in.
 *
 * Widgets that draw records (charts, tables, lists) read `data` as an array of flat rows. Two other
 * shapes are just as common in what an API returns, and a consumer cannot ask the source to change:
 *
 * - **Columns** — one array per field, all the same length (`{ time: [...], temp: [...] }`), the usual
 *   shape of a time series. Read as one row per index.
 * - **Nested records** — fields grouped in objects (`{ properties: { mag: 4.8 } }`), as in GeoJSON
 *   features. A chart or table reads them by dotted path (`"properties.mag"`), as if flattened.
 */

/** Widgets that expect an array for `data`. */
export const ARRAY_DATA: ReadonlySet<string> = new Set([
  'stat-group', 'table', 'list', 'steps', 'gallery',
  'chart.bar', 'chart.line', 'chart.area', 'chart.pie',
  'chart.scatter', 'chart.radar', 'chart.heatmap', 'chart.box',
  'chart.funnel', 'chart.waterfall', 'chart.treemap', 'chart.gantt',
]);

/** Widgets whose rows are addressed by field name (mapping, columns), so nested fields read by dotted path. */
function readsFieldsByPath(widget: string): boolean {
  return widget === 'table' || widget.startsWith('chart.');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * True when `data` is columns: an object whose every value is an array of one length, holding values rather than
 * records — `{ items: [{...}, {...}] }` is records wrapped in an object, not a column, and stays an error to fix.
 */
export function isColumnar(data: unknown): data is Record<string, unknown[]> {
  if (!isPlainObject(data)) return false;
  const columns = Object.values(data);
  if (columns.length === 0 || !columns.every(Array.isArray)) return false;
  const length = (columns[0] as unknown[]).length;
  return columns.every((column) => (column as unknown[]).length === length && !(column as unknown[]).some(isPlainObject));
}

/** One row per index of the columns. */
export function columnsToRows(data: Record<string, unknown[]>): Record<string, unknown>[] {
  const keys = Object.keys(data);
  const length = keys.length > 0 ? data[keys[0]].length : 0;
  return Array.from({ length }, (_, i) => Object.fromEntries(keys.map((key) => [key, data[key][i]])));
}

/**
 * A row whose nested objects are spread into dotted keys — `{ a: { b: 1 } }` reads `{ "a.b": 1 }`.
 * Arrays stay values. A key the row already has as written is kept over a flattened one.
 */
export function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
  if (!Object.values(row).some(isPlainObject)) return row;
  const flat: Record<string, unknown> = {};
  const visit = (value: Record<string, unknown>, prefix: string) => {
    for (const [key, item] of Object.entries(value)) {
      const path = prefix + key;
      if (isPlainObject(item)) visit(item, path + '.');
      else if (!(path in flat)) flat[path] = item;
    }
  };
  // Keys as written first, so a literal "a.b" wins over a flattened one.
  for (const [key, item] of Object.entries(row)) if (!isPlainObject(item)) flat[key] = item;
  for (const [key, item] of Object.entries(row)) if (isPlainObject(item)) visit(item, key + '.');
  return flat;
}

/**
 * `data` in the shape `widget` reads: columns become rows for a widget that takes an array, and a
 * chart's or table's nested rows read by dotted path. Anything else is returned as it is.
 */
export function toRows(widget: string, data: unknown): unknown {
  if (!ARRAY_DATA.has(widget)) return data;
  const rows = isColumnar(data) ? columnsToRows(data) : data;
  if (!Array.isArray(rows) || !readsFieldsByPath(widget)) return rows;
  return rows.some(isPlainObject) ? rows.map((row) => (isPlainObject(row) ? flattenRow(row) : row)) : rows;
}
