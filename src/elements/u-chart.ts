import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetEvent } from '../core/types.js';
import { toEChartsOption } from '../renderers/echarts-adapter.js';

// Tree-shakeable ECharts imports
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart, RadarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

@customElement('u-chart')
export class UChart extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .chart-container {
      width: 100%;
      height: var(--u-widget-chart-height, 300px);
    }
  `;

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  private _chart: echarts.ECharts | null = null;
  private _container: HTMLDivElement | null = null;

  render() {
    if (!this.spec) return nothing;
    const label = this.spec.title ?? `${this.spec.widget} chart`;
    return html`<div class="chart-container" part="chart" role="img" aria-label=${label}></div>`;
  }

  protected firstUpdated() {
    this._container = this.shadowRoot?.querySelector('.chart-container') as HTMLDivElement | null;
    this._initChart();
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
    } catch {
      // ECharts init may fail in non-browser environments
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

    this._chart.setOption(option, true);
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
