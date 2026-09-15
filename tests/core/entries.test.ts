import { describe, it, expect } from 'vitest';
import { widgetEntry } from '../../src/core/entries.js';
import { KNOWN_WIDGETS } from '../../src/core/suggest.js';
import { help } from '../../src/core/catalog.js';

describe('widgetEntry', () => {
  it('maps every known chart type to the charts entry', () => {
    for (const w of KNOWN_WIDGETS.filter((k) => k.startsWith('chart.'))) {
      expect(widgetEntry(w), w).toEqual({ entry: '@iyulab/u-widgets/charts', element: 'uw-chart' });
    }
  });

  it('maps math to the math entry', () => {
    expect(widgetEntry('math')).toEqual({ entry: '@iyulab/u-widgets/math', element: 'uw-math' });
  });

  it('returns undefined for core widgets and for unknown types', () => {
    expect(widgetEntry('metric')).toBeUndefined();
    expect(widgetEntry('form')).toBeUndefined();
    expect(widgetEntry('chart.barr')).toBeUndefined();
    expect(widgetEntry('')).toBeUndefined();
  });
});

describe('KNOWN_WIDGETS', () => {
  it('is exactly the catalog widget list — the typo hint and the entry map must not drift from it', () => {
    const catalog = help().map((w) => w.widget).sort();
    expect([...KNOWN_WIDGETS].sort()).toEqual(catalog);
  });
});
