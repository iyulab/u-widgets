/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/index.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * 계기판 중앙 라벨은 SVG `<text>` 라 text-overflow 가 없다 — 호의 안쪽 폭(viewBox 130)을 넘는 라벨은
 * 컴포넌트가 직접 말줄임한다. 글자 폭을 재야 하므로 happy-dom 이 아니라 실제 엔진에서 잰다.
 */
describe('uw-gauge — 중앙 라벨 말줄임', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  async function mount(label: string) {
    const el = document.createElement('uw-gauge') as HTMLElement & {
      spec: UWidgetSpec;
      updateComplete: Promise<unknown>;
    };
    el.spec = {
      widget: 'gauge',
      data: { value: 85 },
      options: { min: 0, max: 100, thresholds: [{ to: 100, color: '#22c55e', label }] },
    };
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  const subtitle = (el: HTMLElement) => el.shadowRoot!.querySelector<SVGTextElement>('text.gauge-subtitle')!;

  it('긴 라벨은 호 안쪽 폭에 맞춰 말줄임표로 끝난다', async () => {
    const el = await mount('Excellent Working Condition Status Across All Sites');
    const text = subtitle(el);
    expect(text.textContent).toMatch(/…$/);
    expect(text.getComputedTextLength()).toBeLessThanOrEqual(130);
  });

  it('짧은 라벨은 그대로 둔다', async () => {
    const el = await mount('Good');
    expect(subtitle(el).textContent).toBe('Good');
  });

  it('숨긴 채 그려진 계기판은 보이게 될 때 다시 잰다', async () => {
    const box = document.createElement('div');
    box.style.display = 'none';
    document.body.appendChild(box);
    const el = document.createElement('uw-gauge') as HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };
    el.spec = {
      widget: 'gauge',
      data: { value: 85 },
      options: { min: 0, max: 100, thresholds: [{ to: 100, color: '#22c55e', label: 'Excellent Working Condition Status Across All Sites' }] },
    };
    box.appendChild(el);
    await el.updateComplete;
    // 숨김 동안은 글자 폭이 0 이라 잘리지 않는다.
    expect(subtitle(el).textContent).not.toMatch(/…$/);

    box.style.display = '';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    expect(subtitle(el).textContent).toMatch(/…$/);
    expect(subtitle(el).getComputedTextLength()).toBeLessThanOrEqual(130);
  });

  it('값이 바뀌어 라벨이 짧아지면 말줄임이 풀린다', async () => {
    const el = (await mount('Excellent Working Condition Status Across All Sites')) as HTMLElement & {
      spec: UWidgetSpec;
      updateComplete: Promise<unknown>;
    };
    el.spec = {
      widget: 'gauge',
      data: { value: 85 },
      options: { min: 0, max: 100, thresholds: [{ to: 100, color: '#22c55e', label: 'Good' }] },
    };
    await el.updateComplete;
    expect(subtitle(el).textContent).toBe('Good');
  });
});
