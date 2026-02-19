/**
 * Runtime spec scanner that extracts the full property surface from widget specs.
 *
 * `specSurface()` is the single function shared by both the MCP server and
 * the demo props panel — it scans an array of spec objects and returns every
 * key actually used, merged with descriptions from `widget-meta.ts`.
 *
 * Structural guarantee: if a spec uses a property, `specSurface()` reports it.
 */

import {
  MAPPING_DOCS,
  FIELD_PROP_DOCS,
  DATA_FIELD_DOCS,
  OPTION_DOCS,
  getWidgetEvents,
} from './widget-meta.js';

/** A single discovered property with its inferred type and optional description. */
export interface PropInfo {
  key: string;
  /** Inferred runtime type: `"number"`, `"string"`, `"boolean"`, `"object[]"`, etc. */
  type: string;
  /** Description from the registry when available. */
  desc?: string;
}

/** The full property surface extracted from a set of specs. */
export interface SpecSurface {
  /** Top-level spec keys used (data, mapping, options, …). */
  specKeys: string[];
  /** `data.*` keys with inferred types. */
  dataFields: PropInfo[];
  /** `mapping.*` keys with schema descriptions. */
  mappingKeys: PropInfo[];
  /** `options.*` keys with inferred types. */
  optionKeys: PropInfo[];
  /** `fields[].*` keys with schema descriptions. */
  fieldProps: PropInfo[];
  /** Distinct `fields[].type` values used. */
  fieldTypes: string[];
  /** Distinct `actions[].style` values used. */
  actionStyles: string[];
  /** Events emitted by this widget category. */
  events: readonly string[];
}

/** Infer a display type label from a runtime value. */
function typeLabel(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) {
    if (v.length === 0) return 'array';
    const first = v[0];
    if (typeof first === 'object' && first !== null) return 'object[]';
    return `${typeof first}[]`;
  }
  return typeof v;
}

/**
 * Scan an array of spec objects and collect their full property surface.
 *
 * @param specs  - Array of widget spec objects (e.g. variant values).
 * @param widget - Optional widget type string for event lookup.
 * @returns The collected {@link SpecSurface}.
 */
export function specSurface(
  specs: object[],
  widget?: string,
): SpecSurface {
  const specKeySet = new Set<string>();
  const dataMap = new Map<string, string>();
  const mappingMap = new Map<string, string>();
  const optionMap = new Map<string, string>();
  const fieldPropMap = new Map<string, string>();
  const fieldTypeSet = new Set<string>();
  const actionStyleSet = new Set<string>();

  for (const spec of specs) {
    const s = spec as Record<string, unknown>;

    // Top-level spec keys (everything except 'widget')
    for (const k of Object.keys(s)) {
      if (k !== 'widget') specKeySet.add(k);
    }

    // data
    const data = s.data;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item === 'object') {
          for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
            dataMap.set(k, typeLabel(v));
          }
        }
      }
    } else if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        dataMap.set(k, typeLabel(v));
      }
    }

    // mapping
    if (s.mapping && typeof s.mapping === 'object') {
      for (const [k, v] of Object.entries(s.mapping as Record<string, unknown>)) {
        mappingMap.set(k, Array.isArray(v) ? 'string[]' : String(typeof v));
      }
    }

    // options
    if (s.options && typeof s.options === 'object') {
      for (const [k, v] of Object.entries(s.options as Record<string, unknown>)) {
        optionMap.set(k, typeLabel(v));
      }
    }

    // fields (form)
    if (Array.isArray(s.fields)) {
      for (const f of s.fields as Record<string, unknown>[]) {
        for (const [k, v] of Object.entries(f)) {
          fieldPropMap.set(k, k === 'options' ? 'string[]' : typeLabel(v));
        }
        if (typeof f.type === 'string') fieldTypeSet.add(f.type);
      }
    }

    // actions
    if (Array.isArray(s.actions)) {
      for (const a of s.actions as Record<string, unknown>[]) {
        if (typeof a.style === 'string') actionStyleSet.add(a.style);
      }
    }
  }

  // Merge descriptions from registries
  const withDesc = (
    map: Map<string, string>,
    docs: Readonly<Record<string, string>>,
  ): PropInfo[] =>
    [...map.entries()].map(([key, type]) => {
      const desc = docs[key];
      return desc ? { key, type, desc } : { key, type };
    });

  return {
    specKeys: [...specKeySet],
    dataFields: withDesc(dataMap, DATA_FIELD_DOCS),
    mappingKeys: withDesc(mappingMap, MAPPING_DOCS),
    optionKeys: withDesc(optionMap, OPTION_DOCS),
    fieldProps: withDesc(fieldPropMap, FIELD_PROP_DOCS),
    fieldTypes: [...fieldTypeSet],
    actionStyles: [...actionStyleSet],
    events: widget ? getWidgetEvents(widget) : [],
  };
}
