// @vitest-environment node
import { describe, it, expect } from 'vitest';
import schema from '../../schema/u-widget.schema.json';
import {
  MAPPING_DOCS,
  FIELD_PROP_DOCS,
  ACTION_PROP_DOCS,
  OPTION_DOCS,
  WIDGET_OPTIONS,
  WIDGET_DATA_FIELDS,
  WIDGET_INFERENCE,
  WIDGET_EVENTS,
  getWidgetEvents,
  getPrimaryDataField,
} from '../../src/core/widget-meta.js';
import { help } from '../../src/core/catalog.js';

describe('MAPPING_DOCS', () => {
  it('covers all schema mapping properties', () => {
    const schemaKeys = Object.keys(
      (schema.$defs.mapping as Record<string, unknown> & { properties: Record<string, unknown> }).properties,
    );
    for (const key of schemaKeys) {
      expect(MAPPING_DOCS[key], `missing MAPPING_DOCS["${key}"]`).toBeDefined();
    }
  });

  it('has no extra keys beyond schema', () => {
    const schemaKeys = new Set(
      Object.keys(
        (schema.$defs.mapping as Record<string, unknown> & { properties: Record<string, unknown> }).properties,
      ),
    );
    for (const key of Object.keys(MAPPING_DOCS)) {
      expect(schemaKeys.has(key), `extra MAPPING_DOCS key: "${key}"`).toBe(true);
    }
  });
});

describe('FIELD_PROP_DOCS', () => {
  it('covers all schema fieldDefinition properties', () => {
    const schemaKeys = Object.keys(
      (schema.$defs.fieldDefinition as Record<string, unknown> & { properties: Record<string, unknown> }).properties,
    );
    for (const key of schemaKeys) {
      expect(FIELD_PROP_DOCS[key], `missing FIELD_PROP_DOCS["${key}"]`).toBeDefined();
    }
  });

  it('has no extra keys beyond schema', () => {
    const schemaKeys = new Set(
      Object.keys(
        (schema.$defs.fieldDefinition as Record<string, unknown> & { properties: Record<string, unknown> }).properties,
      ),
    );
    for (const key of Object.keys(FIELD_PROP_DOCS)) {
      expect(schemaKeys.has(key), `extra FIELD_PROP_DOCS key: "${key}"`).toBe(true);
    }
  });
});

describe('ACTION_PROP_DOCS', () => {
  it('covers all schema action properties', () => {
    const schemaKeys = Object.keys(
      (schema.$defs.action as Record<string, unknown> & { properties: Record<string, unknown> }).properties,
    );
    for (const key of schemaKeys) {
      expect(ACTION_PROP_DOCS[key], `missing ACTION_PROP_DOCS["${key}"]`).toBeDefined();
    }
  });

  it('has no extra keys beyond schema', () => {
    const schemaKeys = new Set(
      Object.keys(
        (schema.$defs.action as Record<string, unknown> & { properties: Record<string, unknown> }).properties,
      ),
    );
    for (const key of Object.keys(ACTION_PROP_DOCS)) {
      expect(schemaKeys.has(key), `extra ACTION_PROP_DOCS key: "${key}"`).toBe(true);
    }
  });
});

describe('WIDGET_EVENTS', () => {
  it('has entries for known interactive widgets', () => {
    expect(WIDGET_EVENTS.chart).toContain('select');
    expect(WIDGET_EVENTS.table).toContain('select');
    expect(WIDGET_EVENTS.list).toContain('select');
    expect(WIDGET_EVENTS.form).toContain('submit');
    expect(WIDGET_EVENTS.form).toContain('change');
    expect(WIDGET_EVENTS.confirm).toContain('submit');
  });
});

describe('getWidgetEvents', () => {
  it('returns events for direct match', () => {
    expect(getWidgetEvents('form')).toContain('submit');
  });

  it('resolves chart.* prefix to chart events', () => {
    expect(getWidgetEvents('chart.bar')).toContain('select');
    expect(getWidgetEvents('chart.pie')).toContain('select');
  });

  it('returns empty array for unknown widget', () => {
    expect(getWidgetEvents('unknown')).toEqual([]);
  });
});

describe('WIDGET_OPTIONS', () => {
  it('covers every widget in the catalog', () => {
    const all = help();
    for (const info of all) {
      expect(
        WIDGET_OPTIONS[info.widget],
        `missing WIDGET_OPTIONS["${info.widget}"]`,
      ).toBeDefined();
    }
  });

  it('every option key exists in OPTION_DOCS', () => {
    for (const [widget, keys] of Object.entries(WIDGET_OPTIONS)) {
      for (const key of keys) {
        expect(
          OPTION_DOCS[key],
          `WIDGET_OPTIONS["${widget}"] references unknown option "${key}"`,
        ).toBeDefined();
      }
    }
  });

  it('has no extra widgets beyond catalog', () => {
    const catalogWidgets = new Set(help().map((w) => w.widget));
    for (const key of Object.keys(WIDGET_OPTIONS)) {
      expect(catalogWidgets.has(key), `extra WIDGET_OPTIONS key: "${key}"`).toBe(true);
    }
  });
});

describe('WIDGET_INFERENCE', () => {
  it('covers every widget in the catalog', () => {
    const all = help();
    for (const info of all) {
      expect(
        WIDGET_INFERENCE[info.widget],
        `missing WIDGET_INFERENCE["${info.widget}"]`,
      ).toBeDefined();
    }
  });

  it('each entry is a non-empty string', () => {
    for (const [widget, hint] of Object.entries(WIDGET_INFERENCE)) {
      expect(typeof hint).toBe('string');
      expect(hint.length, `empty inference hint for "${widget}"`).toBeGreaterThan(0);
    }
  });
});

describe('WIDGET_DATA_FIELDS', () => {
  it('metric has value field marked required', () => {
    const fields = WIDGET_DATA_FIELDS['metric'];
    expect(fields).toBeDefined();
    const valueField = fields!.find((f) => f.key === 'value');
    expect(valueField).toBeDefined();
    expect(valueField!.required).toBe(true);
  });

  it('gauge has value field marked required', () => {
    const fields = WIDGET_DATA_FIELDS['gauge'];
    expect(fields).toBeDefined();
    expect(fields!.find((f) => f.key === 'value')?.required).toBe(true);
  });

  it('each field has key, type, and desc', () => {
    for (const [widget, fields] of Object.entries(WIDGET_DATA_FIELDS)) {
      for (const f of fields) {
        expect(f.key, `empty key in ${widget}`).toBeTruthy();
        expect(f.type, `empty type for ${widget}.${f.key}`).toBeTruthy();
        expect(f.desc, `empty desc for ${widget}.${f.key}`).toBeTruthy();
      }
    }
  });
});

describe('getPrimaryDataField', () => {
  it('returns "value" for widgets whose headline value field is named value', () => {
    expect(getPrimaryDataField('metric')).toBe('value');
    expect(getPrimaryDataField('gauge')).toBe('value');
    expect(getPrimaryDataField('progress')).toBe('value');
    expect(getPrimaryDataField('stat-group')).toBe('value');
  });

  it('returns "value" for status even though label is also a required field', () => {
    // `status` has two required fields (label, value) — required-ness alone can't identify
    // the primary one, since `label` is typically a static caption, not a bound live value.
    expect(getPrimaryDataField('status')).toBe('value');
  });

  it('returns undefined for widgets with no single fixed headline field (free-form mapping)', () => {
    expect(getPrimaryDataField('chart.line')).toBeUndefined();
    expect(getPrimaryDataField('table')).toBeUndefined();
    expect(getPrimaryDataField('list')).toBeUndefined();
  });

  it('returns undefined for an unknown widget type', () => {
    expect(getPrimaryDataField('not-a-real-widget')).toBeUndefined();
  });

  it('only ever names a field that actually exists in WIDGET_DATA_FIELDS for that widget', () => {
    for (const widget of Object.keys(WIDGET_DATA_FIELDS)) {
      const primary = getPrimaryDataField(widget);
      if (primary === undefined) continue;
      const fields = WIDGET_DATA_FIELDS[widget]!.map((f) => f.key);
      expect(fields, `${widget}: primary field "${primary}" not in WIDGET_DATA_FIELDS`).toContain(primary);
    }
  });
});
