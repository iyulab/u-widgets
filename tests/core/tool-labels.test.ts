// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { setDefaultLocale } from '../../src/core/locale.js';
import { getDefaultToolLabels, getToolLabels, getWidgetLabel, registerToolLabels } from '../../src/core/tool-labels.js';
import { OPTION_DOCS, WIDGET_DATA_FIELDS, WIDGET_OPTIONS, getWidgetDataFields, getWidgetOptions } from '../../src/core/widget-meta.js';
import { help, type WidgetInfo } from '../../src/core/catalog.js';
import { toolLabelsKo } from '../../src/locales/tools-ko.js';

const widgets = (help() as WidgetInfo[]).map(w => w.widget);
const dataFieldKeys = [...new Set(Object.values(WIDGET_DATA_FIELDS).flat().map(f => f.key))];

afterEach(() => setDefaultLocale(undefined));

describe('editor names', () => {
  it('names every widget, option and data field in English and in Korean', () => {
    for (const labels of [getDefaultToolLabels(), toolLabelsKo]) {
      for (const widget of widgets) expect(labels.widgets[widget], widget).toBeTruthy();
      for (const key of Object.keys(OPTION_DOCS)) expect(labels.options[key], key).toBeTruthy();
      for (const key of dataFieldKeys) expect(labels.dataFields[key], key).toBeTruthy();
    }
    // Per-widget names only for keys that widget actually reads.
    for (const labels of [getDefaultToolLabels(), toolLabelsKo]) {
      for (const [widget, names] of Object.entries(labels.widgetOptions)) {
        for (const key of Object.keys(names)) expect(WIDGET_OPTIONS[widget], `${widget}.${key}`).toContain(key);
      }
      for (const [widget, names] of Object.entries(labels.widgetDataFields)) {
        for (const key of Object.keys(names)) expect(WIDGET_DATA_FIELDS[widget]?.map(f => f.key), `${widget}.${key}`).toContain(key);
      }
    }
  });

  it('gives option and data field names in the requested locale, English by default', () => {
    expect(getWidgetOptions('gauge').find(o => o.key === 'min')?.label).toBe('Minimum');
    expect(getWidgetOptions('gauge', 'ko-KR').find(o => o.key === 'min')?.label).toBe('최솟값');
    expect(getWidgetDataFields('metric', 'ko').find(f => f.key === 'trend')?.label).toBe('추세');
    expect(WIDGET_DATA_FIELDS.metric.find(f => f.key === 'trend')?.label).toBe('Trend');
    expect(getWidgetLabel('chart.bar', 'ko')).toBe('막대 차트');
    expect(getWidgetLabel('chart.bar')).toBe('Bar chart');
    expect((help() as WidgetInfo[]).find(w => w.widget === 'gauge')?.label).toBe('Gauge');
  });

  it('prefers a per-widget name where a key means something narrower', () => {
    expect(getWidgetOptions('rating', 'ko').find(o => o.key === 'max')?.label).toBe('아이콘 수');
    expect(getWidgetOptions('gauge', 'ko').find(o => o.key === 'max')?.label).toBe('최댓값');
    expect(getWidgetDataFields('header').find(f => f.key === 'level')?.label).toBe('Heading level');
  });

  it('follows the default locale when none is given, and falls back to English for an unknown one', () => {
    setDefaultLocale('ko');
    expect(getWidgetLabel('gauge')).toBe('게이지');
    expect(getToolLabels('fr').options.min).toBe('Minimum');
  });

  it('merges a partial registration over English', () => {
    registerToolLabels('xx', { options: { min: 'Mín' }, widgetOptions: { rating: { label: 'Texto' } } });
    const labels = getToolLabels('xx');
    expect(labels.options.min).toBe('Mín');
    expect(labels.options.max).toBe('Maximum');
    expect(labels.widgetOptions.rating).toEqual({ max: 'Icons', label: 'Texto' });
  });
});
