import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';

/**
 * **미터의 목표 표시(bullet)는 막대 위 그 값의 자리에, 막대보다 길게 선다** — 상자로 잰다. 유닛 시험은 `left` 문자열을 재는데,
 * 표시가 막대의 상자 안에서 그 비율에 서는가(감싸는 상자가 막대와 같은 폭인가)는 배치의 결과다.
 */
afterEach(() => document.body.replaceChildren());

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));
};

describe('meter target', () => {
  it('stands at the target fraction of the track and reaches past it above and below', async () => {
    const w = document.createElement('u-widget') as HTMLElement & { spec: unknown };
    w.style.cssText = 'display:block;width:320px';
    w.spec = { widget: 'metric', data: { label: 'OEE', value: 72, unit: '%', target: 85, meter: { value: 72, unit: '%' } } };
    document.body.append(w);
    await settle();
    const metric = w.shadowRoot!.querySelector('uw-metric')!;
    await (metric as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const track = metric.shadowRoot!.querySelector('.meter-track')!.getBoundingClientRect();
    const mark = metric.shadowRoot!.querySelector('.meter-target')!.getBoundingClientRect();
    expect(track.width).toBeGreaterThan(100);
    const centre = mark.left + mark.width / 2;
    expect(Math.abs(centre - (track.left + track.width * 0.85))).toBeLessThanOrEqual(1);
    expect(mark.top).toBeLessThan(track.top);
    expect(mark.bottom).toBeGreaterThan(track.bottom);
  });
});
