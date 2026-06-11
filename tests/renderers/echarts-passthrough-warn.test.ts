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
