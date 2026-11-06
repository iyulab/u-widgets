import { describe, it, expect, vi } from 'vitest';

// The CDN script maps `echarts/core`, `echarts/charts`, `echarts/components` and `echarts/renderers` onto the page's
// `echarts` global — a full build that has every chart registered already and exports none of them by name. Reading the
// named charts then gives `undefined`, and handing that to `use` threw while the script loaded ("reading 'install'"),
// so no chart was drawn.
const use = vi.fn();
vi.mock('echarts/core', async importOriginal => ({ ...(await importOriginal<typeof import('echarts/core')>()), use }));
vi.mock('echarts/charts', () => ({
  BarChart: undefined, LineChart: undefined, PieChart: undefined, ScatterChart: undefined, RadarChart: undefined,
  HeatmapChart: undefined, BoxplotChart: undefined, FunnelChart: undefined, TreemapChart: undefined, CustomChart: undefined,
}));
vi.mock('echarts/components', () => ({
  GridComponent: undefined, TooltipComponent: undefined, LegendComponent: undefined, RadarComponent: undefined,
  MarkLineComponent: undefined, MarkPointComponent: undefined, VisualMapComponent: undefined,
}));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: undefined }));

describe('uw-chart on a page whose echarts global is a full build', () => {
  it('loads without handing `use` an empty module', async () => {
    await import('../../src/elements/uw-chart.js');
    expect(use).toHaveBeenCalledTimes(1);
    expect(use.mock.calls[0]![0]).toEqual([]);
    expect(customElements.get('uw-chart')).toBeDefined();
  });
});
