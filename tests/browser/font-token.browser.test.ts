/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import bridge from '../../src/themes/components.css?raw';

/**
 * **위젯은 글꼴을 자기 토큰(`--u-widget-font-family` · `--u-widget-font-mono`)에서 읽는다 — 계산된 글꼴로 잰다.**
 *
 * 그 토큰은 기본값 · 다리 시트(`themes/components.css`)까지 갖추고 있었는데 **읽는 요소가 없었다** — 열네 요소의 `:host` 가
 * `system-ui` 리터럴이라, 다리를 싣고 `--u-font-base` 를 바꿔도 위젯 글자는 그대로였다. 이웃 시험(theme-cascade)은 사용자 정의
 * 속성의 «값» 이 안쪽까지 오는지만 단언해 초록이었다 — 값이 오는 것과 그 값으로 그려지는 것은 다른 사실이다.
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

/** 실제 사용 경로 — `<u-widget spec>` 이 자기 섀도 안에 그린 `uw-*` 의 안쪽 요소. */
async function inner(spec: Record<string, unknown>, selector: string) {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = spec;
  document.body.appendChild(w);
  await w.updateComplete;
  await settle();
  const nested = w.shadowRoot!.querySelector('[nested]') as HTMLElement & { updateComplete?: Promise<unknown> };
  await nested?.updateComplete;
  await settle();
  const el = nested.shadowRoot!.querySelector(selector) as HTMLElement | null;
  if (!el) throw new Error(`${selector} not rendered`);
  return el;
}

const family = (el: Element) => getComputedStyle(el).fontFamily;

describe('위젯 글꼴', () => {
  it('🔴다리 시트를 싣고 --u-font-base 를 바꾸면 위젯 글자가 따라온다', async () => {
    addSheet(bridge);
    addSheet(':root { --u-font-base: Georgia, serif; }');
    const el = await inner({ widget: 'metric', data: { value: 42, label: '매출' } }, '*');
    expect(family(el)).toMatch(/^Georgia/);
  });

  it('🔴다리 시트를 싣고 --u-font-mono 를 바꾸면 마크다운 코드가 따라온다', async () => {
    addSheet(bridge);
    addSheet(':root { --u-font-mono: "Courier New", monospace; }');
    const code = await inner({ widget: 'markdown', data: { content: '본문 `code`' } }, 'code');
    expect(family(code)).toMatch(/^"Courier New"/);
  });

  it('단독 사용 — 소비자가 --u-widget-font-family 를 주면 따라온다', async () => {
    addSheet('u-widget { --u-widget-font-family: Georgia, serif; }');
    const el = await inner({ widget: 'metric', data: { value: 1 } }, '*');
    expect(family(el)).toMatch(/^Georgia/);
  });

  it('NEGATIVE — 시트도 재정의도 없으면 종전 묶음(system-ui)', async () => {
    const el = await inner({ widget: 'metric', data: { value: 1 } }, '*');
    expect(family(el)).toMatch(/^system-ui/);
  });
});
