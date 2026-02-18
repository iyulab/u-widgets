/**
 * Entry point export tests.
 *
 * Verifies that each public entry point (index, charts, tools)
 * exports the expected symbols. This prevents accidental export
 * removal or renaming that would break consumers.
 */
import { describe, it, expect } from 'vitest';

describe('entry point: u-widgets (index)', () => {
  it('exports core functions', async () => {
    const mod = await import('../../src/index.js');

    // Validation
    expect(typeof mod.validate).toBe('function');
    expect(typeof mod.isWidgetSpec).toBe('function');

    // Inference & normalization
    expect(typeof mod.infer).toBe('function');
    expect(typeof mod.normalize).toBe('function');

    // Formdown
    expect(typeof mod.parseFormdown).toBe('function');
    expect(typeof mod.registerFormdownParser).toBe('function');
    expect(typeof mod.getFormdownParser).toBe('function');

    // Formatting
    expect(typeof mod.formatValue).toBe('function');

    // Suggestion
    expect(typeof mod.suggestWidget).toBe('function');

    // Locale
    expect(typeof mod.registerLocale).toBe('function');
    expect(typeof mod.getLocaleStrings).toBe('function');
    expect(typeof mod.formatTemplate).toBe('function');
    expect(typeof mod.getDefaultLocale).toBe('function');
  });

  it('exports UWidget class', async () => {
    const mod = await import('../../src/index.js');
    expect(mod.UWidget).toBeDefined();
    expect(typeof mod.UWidget).toBe('function');
  });
});

describe('entry point: u-widgets/tools', () => {
  it('exports tool functions', async () => {
    const mod = await import('../../src/tools.js');

    expect(typeof mod.help).toBe('function');
    expect(typeof mod.template).toBe('function');
    expect(typeof mod.suggestMapping).toBe('function');
    expect(typeof mod.autoSpec).toBe('function');
  });

  it('help() returns widget catalog', async () => {
    const mod = await import('../../src/tools.js');
    const result = mod.help();
    expect(result).toBeDefined();
    expect(Array.isArray(result) || typeof result === 'object').toBe(true);
  });

  it('template() returns a valid spec', async () => {
    const mod = await import('../../src/tools.js');
    const spec = mod.template('metric');
    expect(spec).toBeDefined();
    expect(spec.widget).toBe('metric');
  });
});

describe('entry point: u-widgets/charts', () => {
  it('exports UChart and toEChartsOption', async () => {
    // Charts entry requires echarts mocks
    const { vi } = await import('vitest');

    vi.doMock('echarts/core', () => ({
      default: { use: vi.fn(), init: vi.fn() },
      use: vi.fn(),
      init: vi.fn(),
    }));
    vi.doMock('echarts/charts', () => ({
      BarChart: {}, LineChart: {}, PieChart: {}, ScatterChart: {},
      RadarChart: {}, HeatmapChart: {}, BoxplotChart: {}, FunnelChart: {},
      TreemapChart: {},
    }));
    vi.doMock('echarts/components', () => ({
      GridComponent: {}, TooltipComponent: {}, LegendComponent: {},
      RadarComponent: {}, MarkLineComponent: {}, VisualMapComponent: {},
    }));
    vi.doMock('echarts/renderers', () => ({
      CanvasRenderer: {},
    }));

    // toEChartsOption is a pure function from echarts-adapter (no echarts dependency)
    const { toEChartsOption } = await import('../../src/renderers/echarts-adapter.js');
    expect(typeof toEChartsOption).toBe('function');
  });

  it('toEChartsOption produces valid option for chart.bar', async () => {
    const { toEChartsOption } = await import('../../src/renderers/echarts-adapter.js');
    const option = toEChartsOption({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }],
    });
    expect(option).toBeDefined();
    expect(option.series).toBeDefined();
    expect(option.xAxis).toBeDefined();
  });
});
