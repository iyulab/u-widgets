/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';

/**
 * **`glow` 틀은 위젯의 상태색(톤)을 따른다 — 계산된 번짐 색으로 잰다.**
 *
 * `core/frame.ts`는 «glow — 테두리와 번짐이 위젯의 톤을 따른다»고 적었는데, 상태색은 위젯 자기 섀도 안에만 있고 틀 컨테이너는
 * 바깥이라 읽지 못했다 — 상태가 다른 카드가 모두 같은 강조색으로 번졌다. 틀 컨테이너가 위젯의 `data.tone`을 받는다.
 */
afterEach(() => document.body.replaceChildren());

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));
};

async function glow(data: Record<string, unknown>, frame = 'glow') {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = { widget: 'status-card', data: { title: '펌프 1', ...data }, options: { frame } };
  document.body.appendChild(w);
  await w.updateComplete;
  await settle();
  const el = w.shadowRoot!.querySelector('.card-container') as HTMLElement | null;
  if (!el) throw new Error('.card-container not rendered');
  return getComputedStyle(el);
}

describe('glow 틀과 위젯의 톤', () => {
  it('🔴상태가 다른 카드는 번짐 색이 다르다', async () => {
    const ok = (await glow({ tone: 'ok' })).boxShadow;
    const alarm = (await glow({ tone: 'alarm' })).boxShadow;
    expect(ok).not.toBe(alarm);
  });

  it('톤이 없으면 강조색 번짐 그대로이고 톤 있는 것과 다르다', async () => {
    const none = (await glow({})).boxShadow;
    const warn = (await glow({ tone: 'warn' })).boxShadow;
    expect(none).not.toBe(warn);
    expect(none).toBe((await glow({})).boxShadow);
  });

  it('glow가 아닌 틀은 톤에 달라지지 않는다', async () => {
    expect((await glow({ tone: 'ok' }, 'card')).boxShadow).toBe((await glow({ tone: 'alarm' }, 'card')).boxShadow);
  });
});
