/// <reference types="@vitest/browser-playwright" />
/// <reference types="vite/client" />
import { describe, it, expect, afterEach } from 'vitest';
import { cdp } from 'vitest/browser';
import '../../src/index.js';
import bridgeCss from '../../src/themes/components.css?raw';

/**
 * 위젯의 전환은 전부 `--u-widget-duration-*` 를 읽는다 — 그 토큰을 0 으로 누르는 것이
 * 동작 줄이기(`prefers-reduced-motion: reduce`)를 지키는 유일한 자리다.
 * 세 배치를 잰다: 위젯 단독 · 브리지만(하우스 시트 없음) · 브리지 + 하우스 지속시간 축.
 * 미디어 질의는 CDP 로 흉내 낸다(실제 엔진의 미디어 판정을 그대로 탄다).
 */

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};

const sheets: HTMLStyleElement[] = [];
const addSheet = (css: string) => {
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
  sheets.push(s);
};

async function reducedMotion(on: boolean) {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }],
  });
}

async function ratingStarDuration(): Promise<string> {
  document.body.innerHTML = '';
  const el = document.createElement('uw-rating') as HTMLElement & { spec: unknown };
  el.spec = { widget: 'rating', data: { value: 3, max: 5 } };
  document.body.appendChild(el);
  await settle();
  const star = el.shadowRoot!.querySelector<HTMLElement>('.rating-icon');
  expect(star, 'a rating icon').toBeTruthy();
  return getComputedStyle(star!).transitionDuration;
}

afterEach(async () => {
  await reducedMotion(false);
  sheets.splice(0).forEach((s) => s.remove());
  document.body.innerHTML = '';
});

describe('u-widgets — prefers-reduced-motion', () => {
  it('단독: 기본은 움직이고, 동작 줄이기면 전환 시간이 0 이다', async () => {
    expect(await ratingStarDuration()).not.toBe('0s');
    await reducedMotion(true);
    expect(await ratingStarDuration()).toBe('0s');
  });

  it('브리지만 실린 채(하우스 시트 없음)에서도 동작 줄이기면 0 이다', async () => {
    addSheet(bridgeCss);
    expect(await ratingStarDuration()).toBe('0.15s');
    await reducedMotion(true);
    expect(await ratingStarDuration()).toBe('0s');
  });

  it('브리지 + 하우스 축: 하우스 값을 따르고, 하우스가 0 으로 누르면 함께 멈춘다', async () => {
    addSheet(bridgeCss);
    addSheet(`:root { --u-duration-fast: 140ms; }
      @media (prefers-reduced-motion: reduce) { :root { --u-duration-fast: 0ms; } }`);
    expect(await ratingStarDuration()).toBe('0.14s');
    await reducedMotion(true);
    expect(await ratingStarDuration()).toBe('0s');
  });
});
