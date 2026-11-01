/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import '../../src/charts.js';

// `options.echarts` is merged onto the generated option, and a `markPoint` in it (the lowest point, the last value) was merged
// but never drawn: the component that draws it was not registered, so the chart looked as if the option were not there.
type View = { type: string };
type Chart = { _chart?: { _componentsViews?: View[] } };

afterEach(() => { document.body.replaceChildren(); });

async function chartViews(echarts?: Record<string, unknown>): Promise<string[]> {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.style.cssText = 'display:block;width:640px;height:360px';
  w.spec = {
    widget: 'chart.line',
    data: [{ m: 'Jan', v: 3 }, { m: 'Feb', v: 1 }, { m: 'Mar', v: 5 }],
    mapping: { x: 'm', y: 'v' },
    ...(echarts && { options: { echarts } }),
  };
  document.body.appendChild(w);
  await w.updateComplete;
  const find = () => w.shadowRoot!.querySelector('uw-chart') as unknown as Chart | null;
  for (let i = 0; i < 50 && !find()?._chart?._componentsViews; i++) await new Promise((r) => setTimeout(r, 40));
  return (find()!._chart!._componentsViews ?? []).map((v) => v.type);
}

describe('a mark point in options.echarts', () => {
  it('is drawn — the chart has the view that draws it', async () => {
    const views = await chartViews({ series: [{ markPoint: { data: [{ type: 'min', name: 'Lowest' }] } }] });
    expect(views).toContain('markPoint');
  });

  it('NEGATIVE — a chart that names none has no such view', async () => {
    expect(await chartViews()).not.toContain('markPoint');
  });
});
