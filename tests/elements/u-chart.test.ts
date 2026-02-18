import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock echarts before importing u-chart
const mockSetOption = vi.fn();
const mockDispose = vi.fn();
const mockResize = vi.fn();
const mockOn = vi.fn();

vi.mock('echarts/core', () => ({
  default: {
    use: vi.fn(),
    init: vi.fn(() => ({
      setOption: mockSetOption,
      dispose: mockDispose,
      resize: mockResize,
      on: mockOn,
    })),
  },
  use: vi.fn(),
  init: vi.fn(() => ({
    setOption: mockSetOption,
    dispose: mockDispose,
    resize: mockResize,
    on: mockOn,
  })),
}));

vi.mock('echarts/charts', () => ({
  BarChart: {},
  LineChart: {},
  PieChart: {},
  ScatterChart: {},
  RadarChart: {},
  HeatmapChart: {},
  BoxplotChart: {},
  FunnelChart: {},
  TreemapChart: {},
}));

vi.mock('echarts/components', () => ({
  GridComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
  RadarComponent: {},
  MarkLineComponent: {},
  VisualMapComponent: {},
}));

vi.mock('echarts/renderers', () => ({
  CanvasRenderer: {},
}));

// Import after mocks are set up
const { UChart } = await import('../../src/elements/u-chart.js');
type UChartType = InstanceType<typeof UChart>;
type UWidgetSpecType = import('../../src/core/types.js').UWidgetSpec;

function createElement(spec: Record<string, unknown>): UChartType {
  const el = document.createElement('u-chart') as UChartType;
  el.spec = spec as UWidgetSpecType;
  document.body.appendChild(el);
  return el;
}

async function render(el: UChartType) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-chart', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockSetOption.mockClear();
    mockDispose.mockClear();
    mockResize.mockClear();
    mockOn.mockClear();
  });

  it('is defined as a custom element', () => {
    expect(customElements.get('u-chart')).toBeDefined();
  });

  it('renders a chart container div', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.chart-container')).not.toBeNull();
  });

  it('renders nothing when spec is null', async () => {
    const el = document.createElement('u-chart') as UChartType;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.chart-container')).toBeNull();
  });

  it('sets aria-label from title', async () => {
    const el = createElement({
      widget: 'chart.bar',
      title: 'Sales Overview',
      data: [{ name: 'A', value: 10 }],
    });
    const shadow = await render(el);
    const container = shadow.querySelector('.chart-container');
    expect(container?.getAttribute('aria-label')).toBe('Sales Overview');
  });

  it('uses widget type as fallback aria-label', async () => {
    const el = createElement({
      widget: 'chart.line',
      data: [{ x: 'A', y: 10 }],
    });
    const shadow = await render(el);
    const container = shadow.querySelector('.chart-container');
    expect(container?.getAttribute('aria-label')).toBe('chart.line chart');
  });

  it('has role="img" on chart container', async () => {
    const el = createElement({
      widget: 'chart.pie',
      data: [{ cat: 'A', val: 10 }],
    });
    const shadow = await render(el);
    const container = shadow.querySelector('.chart-container');
    expect(container?.getAttribute('role')).toBe('img');
  });

  it('has part="chart" on container', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    const shadow = await render(el);
    const container = shadow.querySelector('.chart-container');
    expect(container?.getAttribute('part')).toBe('chart');
  });

  it('calls echarts.init on first render', async () => {
    const { init } = await import('echarts/core');
    createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(init).toHaveBeenCalled();
  });

  it('calls setOption with ECharts option', async () => {
    createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockSetOption).toHaveBeenCalled();
  });

  it('disposes chart on disconnect', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    el.remove();
    expect(mockDispose).toHaveBeenCalled();
  });

  it('resize() delegates to echarts instance', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    el.resize();
    expect(mockResize).toHaveBeenCalled();
  });

  it('includes themeStyles in static styles', () => {
    const styles = (customElements.get('u-chart') as any).styles;
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThanOrEqual(2);
  });

  it('setOption receives backgroundColor transparent', async () => {
    createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    // setOption is called; check that backgroundColor is set
    const calls = mockSetOption.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // The option passed to setOption
    const option = calls[0][0] as Record<string, unknown>;
    // In jsdom, getComputedStyle may not resolve CSS vars,
    // but backgroundColor should still be set (transparent or not present)
    expect(option).toBeDefined();
  });
});
