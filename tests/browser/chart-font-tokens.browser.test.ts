/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import '../../src/charts.js';
import '../../src/themes/components.css';

// A chart's text follows the widget's type tokens — caption for the axes and the chart's own text, label for the
// legend — so a page that rescales its type (a large-text wall display) rescales the chart with it. Through the
// components bridge those tokens are the house ladder's steps of the same names.
// Defect: the canvas text sat at ECharts' fixed 12px whatever the page's type, unreadable on a TV board.
type Axis = { axisLabel: { fontSize?: number } };
type Option = { textStyle: { fontSize?: number }; xAxis: Axis[]; yAxis: Axis[]; legend: { textStyle?: { fontSize?: number } }[] };
type Chart = { _chart?: { getOption(): Option } };

afterEach(() => { document.body.replaceChildren(); });

async function chart(wrapperStyle: string, widgetStyle = 'display:block;width:640px;height:360px'): Promise<Option> {
  const wrap = document.createElement('div');
  wrap.style.cssText = wrapperStyle;
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.style.cssText = widgetStyle;
  w.spec = { widget: 'chart.bar', data: [{ name: 'a', x: 1, y: 2 }, { name: 'b', x: 2, y: 1 }], mapping: { x: 'name', y: ['x', 'y'] } };
  wrap.appendChild(w);
  document.body.appendChild(wrap);
  await w.updateComplete;
  const find = () => w.shadowRoot!.querySelector('uw-chart') as unknown as Chart | null;
  for (let i = 0; i < 50 && !find()?._chart; i++) await new Promise((r) => setTimeout(r, 40));
  return find()!._chart!.getOption();
}

describe('chart text and the type tokens', () => {
  it('a rescaled house ladder reaches the axis labels and the legend', async () => {
    const option = await chart('--u-text-caption-size: 24px; --u-text-label-size: 26px;');
    expect(option.xAxis[0].axisLabel.fontSize).toBe(24);
    expect(option.yAxis[0].axisLabel.fontSize).toBe(24);
    expect(option.legend[0].textStyle?.fontSize).toBe(26);
    expect(option.textStyle.fontSize).toBe(24);
  });

  it('NEGATIVE — with no page type set, the widget defaults keep the familiar sizes', async () => {
    const option = await chart('');
    expect(option.xAxis[0].axisLabel.fontSize).toBe(12);
  });
});
