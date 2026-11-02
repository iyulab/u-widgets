/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';

/**
 * **`options.compact`는 틀의 패딩도 줄인다 — 계산된 패딩으로 잰다.**
 *
 * 틀을 두른 작은 카드(보드 스킨의 `frame`이 부품마다 `options.frame`으로 내려오는 경우)는 틀 패딩이 상자 안쪽을 10~12px씩
 * 먹어, `compact`로도 이름과 읽기가 안 들어갔다. 틀은 면과 테두리를 그대로 두고 패딩만 돌려준다 — 틀이 없을 때나
 * `compact`가 없을 때는 달라지지 않는다.
 */
afterEach(() => document.body.replaceChildren());

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));
};

/** `<u-widget spec>`이 자기 섀도 안에 그린 틀 컨테이너. */
async function container(options: Record<string, unknown>) {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = { widget: 'status-card', data: { title: '펌프 1', status: 'ok', fields: [{ label: '압력', value: '3.2' }] }, options };
  document.body.appendChild(w);
  await w.updateComplete;
  await settle();
  const el = w.shadowRoot!.querySelector('.card-container') as HTMLElement | null;
  if (!el) throw new Error('.card-container not rendered');
  return el;
}

const pad = (el: Element) => {
  const s = getComputedStyle(el);
  return { top: parseFloat(s.paddingTop), left: parseFloat(s.paddingLeft) };
};

describe('틀 패딩과 compact', () => {
  it('🔴compact가 없으면 틀 패딩은 16 × 20 그대로다', async () => {
    expect(pad(await container({ frame: 'card' }))).toEqual({ top: 16, left: 20 });
  });

  it('🔴compact면 틀은 면과 테두리를 두고 패딩만 줄인다', async () => {
    const el = await container({ frame: 'card', compact: true });
    expect(pad(el)).toEqual({ top: 6, left: 10 });
    expect(getComputedStyle(el).borderTopWidth).toBe('1px');
  });

  it('compact여도 마스크로 가장자리를 파낸 틀은 홈을 비킬 만큼 남긴다', async () => {
    expect(pad(await container({ frame: 'ticket', compact: true })).top).toBe(12);
    expect(pad(await container({ frame: 'postage', compact: true }))).toEqual({ top: 10, left: 10 });
  });
});
