/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import '../../src/charts.js';

// A skin is tokens set on the widget: a paper card's ink and face must reach the chart's canvas too, or a chart on a
// light paper card in a dark page draws its labels in the dark theme's light ink and they vanish.
type Option = { textStyle: { color: string; fontFamily?: string }; yAxis: { axisLabel: { color: string } }[] };
type Chart = { _chart?: { getOption(): Option } };

afterEach(() => { document.body.replaceChildren(); });

describe('a skin set on the widget', () => {
  it('reaches the chart: ink, muted ink and face', async () => {
    const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; theme: string | null; updateComplete: Promise<unknown> };
    w.theme = 'dark';
    w.style.cssText = 'display:block;width:400px;--u-widget-bg:#f4ecd8;--u-widget-text:#2b2118;--u-widget-text-secondary:#6b5a45;--u-widget-font-family:Georgia, serif';
    w.spec = { widget: 'chart.bar', data: [{ name: 'a', value: 1 }, { name: 'b', value: 2 }], options: { frame: 'plate' } };
    document.body.appendChild(w);
    await w.updateComplete;
    const find = () => w.shadowRoot!.querySelector('uw-chart') as unknown as Chart | null;
    for (let i = 0; i < 50 && !find()?._chart; i++) await new Promise((r) => setTimeout(r, 40));
    const option = find()!._chart!.getOption();
    expect(option.textStyle.color.toLowerCase()).toBe('#2b2118');
    expect(option.textStyle.fontFamily).toBe('Georgia, serif');
    expect(option.yAxis[0].axisLabel.color.toLowerCase()).toBe('#6b5a45');
    expect(w.shadowRoot!.querySelector('[part="card"]')?.getAttribute('data-frame')).toBe('plate');
  });
});
