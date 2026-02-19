import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetEvent } from '../core/types.js';
import { toEChartsOption } from '../renderers/echarts-adapter.js';
import { themeStyles } from '../styles/tokens.js';

// Tree-shakeable ECharts imports
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart, RadarChart, HeatmapChart, BoxplotChart, FunnelChart, TreemapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  MarkLineComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  HeatmapChart,
  BoxplotChart,
  FunnelChart,
  TreemapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  MarkLineComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

@customElement('u-chart')
export class UChart extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
        container: u-chart / inline-size;
      }

      .chart-container {
        width: 100%;
        height: var(--u-widget-chart-height, 300px);
      }

      @container u-chart (max-width: 20rem) {
        .chart-container {
          height: var(--u-widget-chart-height-narrow, 200px);
        }
      }
    `,
  ];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  private _chart: echarts.ECharts | null = null;
  private _container: HTMLDivElement | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  render() {
    if (!this.spec) return nothing;
    const label = this.spec.title ?? `${this.spec.widget} chart`;
    return html`<div class="chart-container" part="chart" role="img" aria-label=${label}></div>`;
  }

  protected firstUpdated() {
    this._container = this.shadowRoot?.querySelector('.chart-container') as HTMLDivElement | null;
    this._initChart();
    if (this._container) {
      this._resizeObserver = new ResizeObserver(() => this._chart?.resize());
      this._resizeObserver.observe(this._container);
    }
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('spec') && this._container) {
      this._updateChart();
    }
  }

  private _initChart() {
    if (!this._container || !this.spec) return;

    try {
      this._chart = echarts.init(this._container);
      this._chart.on('click', (params: Record<string, unknown>) => {
        this._onChartClick(params);
      });
      this._updateChart();
    } catch (e) {
      console.warn('[u-chart] Failed to initialize ECharts:', (e as Error).message);
    }
  }

  private _onChartClick(params: Record<string, unknown>) {
    if (!this.spec) return;
    const detail: UWidgetEvent = {
      type: 'select',
      widget: this.spec.widget,
      id: this.spec.id,
      data: {
        name: params.name as string,
        seriesName: params.seriesName as string,
        value: params.value,
        dataIndex: params.dataIndex as number,
      },
    };
    this.dispatchEvent(
      new CustomEvent('u-widget-internal', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _updateChart() {
    if (!this._chart || !this.spec) return;

    const option = toEChartsOption(this.spec);

    // Inject theme colors from CSS custom properties
    const themeColors = this._readThemeColors();
    if (themeColors.length > 0) {
      option.color = themeColors;
    }
    if (this._readCSSVar('--u-widget-bg')) {
      option.backgroundColor = 'transparent';
    }

    // Inject text/axis/grid theme from CSS variables
    this._applyThemeStyle(option);

    this._chart.setOption(option, true);
  }

  private _applyThemeStyle(option: Record<string, unknown>) {
    const textColor = this._readCSSVar('--u-widget-text');
    const secondaryColor = this._readCSSVar('--u-widget-text-secondary');
    const borderColor = this._readCSSVar('--u-widget-border');

    if (!textColor) return; // no theme vars available

    // Global text style
    option.textStyle = { ...(option.textStyle as Record<string, unknown>), color: textColor };

    // Axis styling
    const axisStyle = {
      axisLabel: { color: secondaryColor || textColor },
      axisLine: { lineStyle: { color: borderColor || secondaryColor } },
      splitLine: { lineStyle: { color: borderColor } },
    };
    if (option.xAxis && typeof option.xAxis === 'object') {
      option.xAxis = { ...option.xAxis as Record<string, unknown>, ...axisStyle };
    }
    if (option.yAxis && typeof option.yAxis === 'object') {
      option.yAxis = { ...option.yAxis as Record<string, unknown>, ...axisStyle };
    }

    // Legend
    if (option.legend && typeof option.legend === 'object') {
      option.legend = { ...option.legend as Record<string, unknown>, textStyle: { color: textColor } };
    }
  }

  private _readThemeColors(): string[] {
    const colors: string[] = [];
    // Read --u-widget-chart-color-N (1-based) custom properties
    for (let i = 1; i <= 10; i++) {
      const c = this._readCSSVar(`--u-widget-chart-color-${i}`);
      if (c) colors.push(c);
      else break;
    }
    // Fallback: use --u-widget-primary as first color if no palette defined
    if (colors.length === 0) {
      const primary = this._readCSSVar('--u-widget-primary');
      if (primary) colors.push(primary);
    }
    return colors;
  }

  private _readCSSVar(name: string): string {
    return getComputedStyle(this).getPropertyValue(name).trim();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._chart?.dispose();
    this._chart = null;
  }

  /** Resize the chart (call when container size changes). */
  resize() {
    this._chart?.resize();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-chart': UChart;
  }
}
