import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * options.echarts passthrough의 false affordance 방지 검증.
 *
 * 배경(ISSUE-20260609-uwidgets-echarts-datazoom-passthrough):
 * passthrough는 옵션 객체만 병합할 뿐 해당 옵션이 요구하는 ECharts 컴포넌트
 * 모듈을 등록하지 않는다. dataZoom/toolbox 등 미등록 컴포넌트 키를 전달하면
 * 옵션은 들어가지만 런타임에 동작하지 않으므로, 소비자가 원인을 알 수 있도록
 * dev 경고를 출력해야 한다.
 */

function spec(overrides: Partial<UWidgetSpec>): UWidgetSpec {
  return { widget: 'chart.bar', ...overrides } as UWidgetSpec;
}

const DATA = [{ month: 'Jan', sales: 100 }];

describe('echarts passthrough — 미등록 컴포넌트 키 경고', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let toEChartsOption: typeof import('../../src/renderers/echarts-adapter.js').toEChartsOption;

  beforeEach(async () => {
    // 모듈 스코프의 warn-once 상태 초기화를 위해 매 테스트 fresh import
    vi.resetModules();
    toEChartsOption = (await import('../../src/renderers/echarts-adapter.js')).toEChartsOption;
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('dataZoom 전달 시 경고를 출력한다', () => {
    toEChartsOption(spec({
      data: DATA,
      options: { echarts: { dataZoom: [{ type: 'inside' }] } },
    }));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain('dataZoom');
    expect(message).toContain('not register');
  });

  it('toolbox, title 등 다른 미등록 키도 경고한다', () => {
    toEChartsOption(spec({
      data: DATA,
      options: { echarts: { toolbox: {}, title: { text: 'T' } } },
    }));
    const messages = warnSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(messages).toContain('toolbox');
    expect(messages).toContain('title');
  });

  it('같은 키는 1회만 경고한다', () => {
    const s = spec({ data: DATA, options: { echarts: { dataZoom: [{ type: 'inside' }] } } });
    toEChartsOption(s);
    toEChartsOption(s);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('등록된 컴포넌트 키(legend/tooltip/grid/xAxis)는 경고하지 않는다', () => {
    toEChartsOption(spec({
      data: DATA,
      options: {
        echarts: {
          legend: { orient: 'horizontal' },
          tooltip: { show: true },
          grid: { top: 10 },
          xAxis: { name: 'Month' },
        },
      },
    }));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('경고가 있어도 옵션 병합 결과는 동일하다', () => {
    const result = toEChartsOption(spec({
      data: DATA,
      options: { echarts: { dataZoom: [{ type: 'inside' }] } },
    }));
    expect(result.dataZoom).toEqual([{ type: 'inside' }]);
  });
});

/**
 * series type false affordance 방지 검증.
 *
 * 배경(ISSUE-20260705-uwidgets-customchart-not-registered):
 * options.series[i].type 오버라이드 또는 options.echarts.series[].type passthrough로
 * 미등록 series type(graph/sankey/gauge 등)을 요청하면 옵션은 병합되지만 런타임에
 * 미렌더된다(ECharts가 자체 "Series X is used but not imported" 경고). 컴포넌트 키
 * 가드와 대칭으로 u-widgets 친절 경고 + flex-chart 리디렉트를 출력해야 한다.
 * CustomChart는 이제 등록되므로 type:'custom'은 경고하지 않는다.
 */
describe('echarts series type — 미등록 series 경고', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let toEChartsOption: typeof import('../../src/renderers/echarts-adapter.js').toEChartsOption;

  beforeEach(async () => {
    vi.resetModules();
    toEChartsOption = (await import('../../src/renderers/echarts-adapter.js')).toEChartsOption;
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('options.series[i].type 오버라이드로 미등록 type 요청 시 경고한다', () => {
    toEChartsOption(spec({
      data: DATA,
      options: { series: [{ type: 'gauge' }] },
    }));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain('gauge');
    expect(message).toContain('does not register');
    expect(message).toContain('flex-chart');
  });

  it('options.echarts.series passthrough로 미등록 type 요청 시 경고한다', () => {
    toEChartsOption(spec({
      data: DATA,
      options: { echarts: { series: [{ type: 'sankey' }] } },
    }));
    const messages = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(messages).toContain('sankey');
  });

  it('custom series(passthrough — 실제 지원 경로)는 경고하지 않는다', () => {
    // custom은 CustomChart 등록으로 지원되나 renderItem을 담아야 하므로 passthrough 경로 사용.
    // (options.series 오버라이드는 style 키만 복사 → renderItem 유실. README 참조)
    toEChartsOption(spec({
      data: DATA,
      options: { echarts: { series: [{ type: 'custom', renderItem: () => ({}) }] } },
    }));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('오버라이드 없는 기본 생성 series는 경고하지 않는다', () => {
    toEChartsOption(spec({ data: DATA }));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('같은 미등록 type은 1회만 경고한다', () => {
    const s = spec({ data: DATA, options: { series: [{ type: 'graph' }] } });
    toEChartsOption(s);
    toEChartsOption(s);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
