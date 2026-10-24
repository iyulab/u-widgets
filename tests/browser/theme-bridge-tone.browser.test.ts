/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import bridge from '../../src/themes/components.css?raw';

/**
 * **다리 시트를 실은 앱에서 `warn` 톤은 하우스의 «글자용» 경고색(`--u-warning-color-strong`)을 따른다 — 칠해진 `--tone` 으로 잰다.**
 *
 * 0.42.0 이 `warn` 에 자기 값(`#b45309`)을 주자 다리 시트가 잇던 `--u-widget-warning` 을 읽는 곳이 없어졌고, 테마를 입힌 앱의 `warn`
 * 은 위젯 기본값으로 남았다. 다른 셋(`ok` · `alarm` · `accent`)은 역할색을 거쳐 따라가므로 같은 자리에서 함께 잰다.
 */
const sheets: HTMLStyleElement[] = [];
const addSheet = (css: string) => {
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
  sheets.push(s);
};

afterEach(() => {
  document.body.replaceChildren();
  sheets.splice(0).forEach((s) => s.remove());
});

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 60));
};

/** 실제 사용 경로 — `<u-widget spec>` 이 자기 섀도 안에 그린 `uw-status` 의 톤 항목. */
async function toneOf(tone: string) {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = { widget: 'status', data: [{ label: 'Pump', value: 'x', tone }] };
  document.body.appendChild(w);
  await w.updateComplete;
  await settle();
  const nested = w.shadowRoot!.querySelector('[nested]') as HTMLElement & { updateComplete?: Promise<unknown> };
  await nested?.updateComplete;
  await settle();
  const el = nested.shadowRoot!.querySelector(`[data-tone='${tone}']`);
  if (!el) throw new Error(`[data-tone=${tone}] not rendered`);
  return getComputedStyle(el).getPropertyValue('--tone').trim();
}

const HOUSE = ':root { --u-warning-color-strong: rgb(1, 2, 3); --u-warning-color: rgb(9, 9, 9); --u-success-color: rgb(4, 5, 6); }';

describe('다리 시트의 톤', () => {
  it('🔴warn 은 --u-warning-color-strong 을 따른다', async () => {
    addSheet(bridge);
    addSheet(HOUSE);
    expect(await toneOf('warn')).toBe('rgb(1, 2, 3)');
  });

  it('ok 는 역할색(--u-success-color)을 거쳐 따른다', async () => {
    addSheet(bridge);
    addSheet(HOUSE);
    expect(await toneOf('ok')).toBe('rgb(4, 5, 6)');
  });

  it('NEGATIVE — 다리 시트가 없으면 warn 은 위젯 값(#b45309)', async () => {
    addSheet(HOUSE);
    expect(await toneOf('warn')).toBe('#b45309');
  });
});
