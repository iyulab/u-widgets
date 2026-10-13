/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import '../../src/charts.js';

/**
 * 페이지가 테마를 바꾸면 이미 그린 차트도 바뀐다 — 실제 경로(`<u-widget spec>` → 섀도 → `uw-chart` → ECharts)로 잰다.
 *
 * 캔버스는 그릴 때 읽은 토큰 값을 쥐고 있다. 종전에는 위젯 자신의 `theme` 이 바뀔 때(= `data-theme` 동기화)만 다시 그려,
 * `@iyulab/components` 의 `<html theme>` 이나 `dark` 클래스로 바꾸는 페이지에서는 셸·카드만 다크로 가고 차트 격자·축 글자는
 * 라이트 때 값으로 남았다(다크 카드 위 흰 격자). 브리지 시트와 같은 형태의 규칙을 붙여 캐스케이드를 잰다.
 */
const TAGS = 'u-widget, uw-chart';
const sheets: HTMLStyleElement[] = [];
const addSheet = (css: string) => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); sheets.push(s); };
const root = document.documentElement;

afterEach(() => {
  document.body.replaceChildren();
  sheets.splice(0).forEach((s) => s.remove());
  root.removeAttribute('theme');
  root.classList.remove('dark');
});

type Option = { yAxis: { splitLine: { lineStyle: { color: string } } }[]; textStyle: { color: string } };
type Chart = { _chart?: { getOption(): Option } };

async function mountChart() {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.style.display = 'block';
  w.style.width = '400px';
  w.spec = { widget: 'chart.bar', data: [{ name: 'a', value: 1 }, { name: 'b', value: 2 }] };
  document.body.appendChild(w);
  await w.updateComplete;
  const find = () => w.shadowRoot!.querySelector('uw-chart') as unknown as Chart | null;
  for (let i = 0; i < 50 && !find()?._chart; i++) await new Promise((r) => setTimeout(r, 40));
  return () => find()!._chart!.getOption();
}

const gridColor = (o: Option) => o.yAxis[0].splitLine.lineStyle.color.toLowerCase();
const settle = () => new Promise((r) => setTimeout(r, 60));

describe('페이지 테마 전환 → 차트', () => {
  it('🔴`<html theme="dark">`(components Theme 이 쓰는 속성)로 바꾸면 격자 · 글자가 다크 토큰으로 다시 그려진다', async () => {
    addSheet(':root { --page-grid: #e5e5e5; --page-ink: #111111; } :root[theme="dark"] { --page-grid: #333333; --page-ink: #eeeeee; }');
    addSheet(`:where(${TAGS}) { --u-widget-border: var(--page-grid); --u-widget-text: var(--page-ink); }`);
    const option = await mountChart();
    expect(gridColor(option())).toBe('#e5e5e5');

    root.setAttribute('theme', 'dark');
    await settle();
    expect(gridColor(option())).toBe('#333333');
    expect(option().textStyle.color.toLowerCase()).toBe('#eeeeee');
  });

  it('🔴페이지 자신의 `dark` 클래스로 바꿔도 다시 그려진다(속성 이름은 페이지 몫)', async () => {
    addSheet(':root { --page-grid: #e5e5e5; } :root.dark { --page-grid: #333333; }');
    addSheet(`:where(${TAGS}) { --u-widget-border: var(--page-grid); --u-widget-text: #111111; }`);
    const option = await mountChart();
    root.classList.add('dark');
    await settle();
    expect(gridColor(option())).toBe('#333333');
  });

  it('⚪NEGATIVE — 토큰을 옮기지 않는 속성 변화는 다시 그리지 않는다(setOption 0회)', async () => {
    addSheet(`:where(${TAGS}) { --u-widget-border: #e5e5e5; --u-widget-text: #111111; }`);
    await mountChart();
    const chart = (document.querySelector('u-widget')!.shadowRoot!.querySelector('uw-chart') as unknown as
      { _chart: { setOption: (...a: unknown[]) => unknown } })._chart;
    let draws = 0;
    const setOption = chart.setOption.bind(chart);
    chart.setOption = (...a: unknown[]) => { draws++; return setOption(...a); };
    root.classList.add('unrelated');
    await settle();
    root.classList.remove('unrelated');
    await settle();
    expect(draws).toBe(0);
  });
});
