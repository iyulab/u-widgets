// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getPrimaryDataField } from '../../src/core/primary-field.js';
import { WIDGET_DATA_FIELDS } from '../../src/core/widget-meta.js';

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
