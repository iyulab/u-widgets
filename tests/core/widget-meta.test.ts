// @vitest-environment node
import { describe, it, expect } from 'vitest';
import schema from '../../schema/u-widget.schema.json';
import {
  MAPPING_DOCS,
  FIELD_PROP_DOCS,
  ACTION_PROP_DOCS,
  OPTION_DOCS,
  OPTION_TYPES,
  getWidgetOptions,
  WIDGET_OPTIONS,
  WIDGET_DATA_FIELDS,
  WIDGET_INFERENCE,
  WIDGET_EVENTS,
  getWidgetEvents,
} from '../../src/core/widget-meta.js';
import { help, type WidgetDetail } from '../../src/core/catalog.js';

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

/** Whether `value` fits a type written in `DataFieldInfo.type` notation (top level only). */
function fits(value: unknown, type: string): boolean {
  return type.split(/\s*\|\s*(?![^{(]*[})])/).some(alt => {
    const t = alt.trim();
    if (/^".*"$/.test(t)) return value === t.slice(1, -1);
    if (t.endsWith('[]')) return Array.isArray(value);
    if (t === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    return typeof value === t;
  });
}

describe('option value types', () => {
  it('types every option OPTION_DOCS describes, and nothing else', () => {
    expect(Object.keys(OPTION_TYPES).sort()).toEqual(Object.keys(OPTION_DOCS).sort());
  });

  it('gives every option a widget lists its description and type', () => {
    for (const widget of Object.keys(WIDGET_OPTIONS)) {
      for (const option of getWidgetOptions(widget)) {
        expect(option.desc, `${widget}.${option.key} desc`).not.toBe('');
        expect(option.type, `${widget}.${option.key} type`).toBeTruthy();
      }
    }
  });

  it("matches the library's own examples: each option they set is listed for the widget and fits its type", () => {
    for (const widget of Object.keys(WIDGET_OPTIONS)) {
      const detail = help(widget);
      if (Array.isArray(detail)) continue;
      const options = new Map(getWidgetOptions(widget).map(o => [o.key, o]));
      for (const { spec } of (detail as WidgetDetail).examples) {
        for (const [key, value] of Object.entries((spec.options ?? {}) as Record<string, unknown>)) {
          const option = options.get(key);
          expect(option, `${widget} example sets options.${key}, which WIDGET_OPTIONS does not list`).toBeDefined();
          expect(fits(value, option!.type), `${widget} options.${key} = ${JSON.stringify(value)} vs ${option!.type}`).toBe(true);
          if (option!.enum) expect(option!.enum).toContain(value);
        }
      }
    }
  });

  it('gives a default only where it fits the type', () => {
    for (const widget of Object.keys(WIDGET_OPTIONS)) {
      for (const option of getWidgetOptions(widget)) {
        if (option.default !== undefined) expect(fits(option.default, option.type), `${widget}.${option.key}`).toBe(true);
      }
    }
  });

  it("lists the options a widget reads — not compose's top-level layout, and the divider's label and spacing", () => {
    expect(WIDGET_OPTIONS.compose).not.toContain('layout');
    expect(WIDGET_OPTIONS.compose).not.toContain('columns');
    expect(WIDGET_OPTIONS.divider).toEqual(['label', 'spacing']);
  });

  it('adjusts an option per widget: its default, its choices, its meaning', () => {
    const gauge = new Map(getWidgetOptions('gauge').map(o => [o.key, o]));
    expect(gauge.get('min')).toMatchObject({ type: 'number', default: 0 });
    expect(gauge.get('max')).toMatchObject({ type: 'number', default: 100 });
    expect(getWidgetOptions('kv').find(o => o.key === 'layout')).toMatchObject({ enum: ['vertical', 'horizontal', 'grid'], default: 'vertical' });
    expect(getWidgetOptions('rating').find(o => o.key === 'max')).toMatchObject({ default: 5, desc: 'Number of icons' });
  });
});

describe('data field choices', () => {
  it('lists the values of a field typed as a union of string literals', () => {
    const level = WIDGET_DATA_FIELDS.status.find(f => f.key === 'level');
    expect(level?.enum).toEqual(['info', 'success', 'warning', 'error', 'neutral']);
    expect(WIDGET_DATA_FIELDS.status.find(f => f.key === 'label')?.enum).toBeUndefined();
  });
});
