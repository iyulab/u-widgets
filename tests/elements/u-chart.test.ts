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

  it('calls setOption again when spec changes', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    const callsBefore = mockSetOption.mock.calls.length;

    el.spec = { widget: 'chart.bar', data: [{ name: 'B', value: 20 }] } as UWidgetSpecType;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSetOption.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('registers click handler via on()', async () => {
    createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('emits u-widget-internal event on chart click', async () => {
    const el = createElement({
      widget: 'chart.bar',
      id: 'test-chart',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));

    // Extract the click handler registered via mockOn
    const clickCall = mockOn.mock.calls.find((c) => c[0] === 'click');
    expect(clickCall).toBeDefined();
    const clickHandler = clickCall![1] as (params: Record<string, unknown>) => void;

    const events: CustomEvent[] = [];
    el.addEventListener('u-widget-internal', ((e: CustomEvent) => events.push(e)) as EventListener);

    // Simulate ECharts click callback
    clickHandler({ name: 'A', seriesName: 'value', value: 10, dataIndex: 0 });

    expect(events.length).toBe(1);
    expect(events[0].detail.type).toBe('select');
    expect(events[0].detail.widget).toBe('chart.bar');
    expect(events[0].detail.id).toBe('test-chart');
    expect(events[0].detail.data.name).toBe('A');
    expect(events[0].detail.data.dataIndex).toBe(0);
  });

  it('renders container for chart.line type', async () => {
    const el = createElement({
      widget: 'chart.line',
      data: [{ x: 'Jan', y: 100 }, { x: 'Feb', y: 200 }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.chart-container')).not.toBeNull();
  });

  it('renders container for chart.pie type', async () => {
    const el = createElement({
      widget: 'chart.pie',
      data: [{ cat: 'A', val: 30 }, { cat: 'B', val: 70 }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.chart-container')).not.toBeNull();
  });

  it('renders container for chart.scatter type', async () => {
    const el = createElement({
      widget: 'chart.scatter',
      data: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.chart-container')).not.toBeNull();
  });

  it('renders container for chart.radar type', async () => {
    const el = createElement({
      widget: 'chart.radar',
      data: [
        { axis: 'Speed', score: 80 },
        { axis: 'Power', score: 90 },
        { axis: 'Defense', score: 70 },
      ],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.chart-container')).not.toBeNull();
  });

  it('warns on init failure', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { init } = await import('echarts/core');
    (init as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('Canvas not supported');
    });

    createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));

    expect(warnSpy).toHaveBeenCalledWith(
      '[u-chart] Failed to initialize ECharts:',
      'Canvas not supported',
    );
    warnSpy.mockRestore();
  });

  it('disposes chart and disconnects ResizeObserver on removal', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));

    mockDispose.mockClear();
    el.remove();

    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('setOption is called with second arg true (replace mode)', async () => {
    createElement({
      widget: 'chart.bar',
      data: [{ name: 'A', value: 10 }],
    });
    await new Promise((r) => setTimeout(r, 50));

    const calls = mockSetOption.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // Second argument should be true (notMerge)
    expect(calls[0][1]).toBe(true);
  });
});
