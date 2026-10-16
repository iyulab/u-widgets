// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { checkSpec } from '../../src/core/check-spec.js';
import { help } from '../../src/core/catalog.js';
import { specErrorMessage } from '../../src/core/schema.js';
import type { WidgetDetail } from '../../src/core/catalog.js';

describe('checkSpec', () => {
  it('takes every example the catalog gives, with nothing to warn about', () => {
    for (const { widget } of help()) {
      for (const { label, spec } of (help(widget) as WidgetDetail).examples ?? []) {
        expect(checkSpec(spec), `${widget} — ${label}`).toMatchObject({ valid: true, warnings: [] });
      }
    }
  });

  it('refuses a widget the library does not have, and names the near spelling', () => {
    const result = checkSpec({ widget: 'lst', data: [] });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([{ code: 'widget-unknown', params: { widget: 'lst' }, path: [] }]);
    expect(result.errors).toEqual([specErrorMessage(result.issues[0])]);
    expect(result.warnings).toEqual(['did you mean "list"?']);
    expect(checkSpec({ widget: 'chart.bars' }).warnings).toEqual(['did you mean "chart.bar"?']);
  });

  it('warns of a key no widget reads, naming the keys a spec takes', () => {
    const { valid, warnings } = checkSpec({ widget: 'list', data: [{ a: 1 }], rows: [1] });
    expect(valid).toBe(true);
    expect(warnings).toEqual([expect.stringMatching(/^"rows" is not read by any widget — a spec takes id, title, .*data, mapping/)]);
  });

  it('says to move an option of the widget written at the top level into options', () => {
    const { warnings } = checkSpec({ widget: 'list', data: [{ a: 1 }], compact: true });
    expect(warnings).toEqual(['"compact" is an option of list — put it in options: { "compact": … }']);
  });

  it('warns of an option the widget does not have, and of an option value of the wrong type', () => {
    expect(checkSpec({ widget: 'list', data: [], options: { compact: 'yes', dense: true } }).warnings).toEqual([
      'options.compact should be a boolean, not "yes"',
      'options.dense is not an option of list — it takes compact',
    ]);
    expect(checkSpec({ widget: 'gauge', data: { value: 3 }, options: { max: '100' } }).warnings).toEqual(['options.max should be a number, not "100"']);
    expect(checkSpec({ widget: 'metric', data: { value: 3 }, options: { unit: 'kW' } }).warnings).toEqual(['options.unit is not an option of metric — it takes none']);
  });

  it('answers as validate does when the structure itself is wrong', () => {
    expect(checkSpec({ widget: 'gauge', data: [1] }).issues[0].code).toBe('data-not-object');
  });
});
