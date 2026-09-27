/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import '../../src/charts.js';

/**
 * 차트 팔레트 브리지 — 실제 경로(`<u-widget spec>` → 섀도 → `uw-chart` → ECharts)로 잰다.
 * 브리지는 `--u-widget-chart-color-N` 을 하우스 `--u-chart-color-N` 에 칸 대 칸으로 잇는다.
 * 시트 파일을 import 하지 않고 같은 형태의 규칙을 붙인다(재는 대상이 번들러가 아니라 캐스케이드가 되도록 —
 * `theme-cascade.browser.test.ts` 와 같은 이유).
 */
const TAGS = 'u-widget, uw-chart';
const sheets: HTMLStyleElement[] = [];
const addSheet = (css: string) => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); sheets.push(s); };

afterEach(() => { document.body.replaceChildren(); sheets.splice(0).forEach((s) => s.remove()); });

async function chartColors(): Promise<string[]> {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.style.display = 'block';
  w.style.width = '400px';
  w.spec = { widget: 'chart.bar', data: [{ name: 'a', value: 1 }, { name: 'b', value: 2 }] };
  document.body.appendChild(w);
  await w.updateComplete;
  let chart: { _chart?: { getOption(): { color: string[] } } } | null = null;
  for (let i = 0; i < 50 && !chart?._chart; i++) {
    chart = w.shadowRoot!.querySelector('uw-chart') as typeof chart;
    await new Promise((r) => setTimeout(r, 40));
  }
  return chart!._chart!.getOption().color;
}

describe('차트 팔레트 브리지 — 실제 경로', () => {
  it('🔴하우스 차트 팔레트가 섀도 안 ECharts 의 계열 색이 된다(순서 그대로)', async () => {
    addSheet(':root { --u-chart-color-1: #123456; --u-chart-color-2: #abcdef; }');
    addSheet(`:where(${TAGS}) {
      --u-widget-chart-color-1: var(--u-chart-color-1, #4f46e5);
      --u-widget-chart-color-2: var(--u-chart-color-2, #0ea5e9);
    }`);
    const colors = await chartColors();
    expect(colors.slice(0, 2).map((c) => c.toLowerCase())).toEqual(['#123456', '#abcdef']);
  });

  it('⚪NEGATIVE — 하우스 축이 없으면 폴백이 위젯 기본 팔레트를 낸다', async () => {
    addSheet(`:where(${TAGS}) { --u-widget-chart-color-1: var(--u-chart-color-absent, #4f46e5); }`);
    const colors = await chartColors();
    expect(colors[0].toLowerCase()).toBe('#4f46e5');
  });
});
