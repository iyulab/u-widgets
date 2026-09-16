/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/index.js';

/**
 * **이 패키지의 테마 계약 절반은 «캐스케이드» 이고, 그것은 실제 엔진으로만 갈린다.**
 *
 * 토큰(`src/styles/tokens.ts`)은 섀도 DOM 의 `:host` 에 선언된다. 바깥 시트가 그것을
 * 이기는지는 **«바깥 트리 우선» 규칙과 특이도 중 무엇이 먼저 적용되는가**로 결정되는데,
 * happy-dom 은 그 판정을 하지 않는다 — 유닛 스위트는 «시트에 무엇이 적혔는가» 까지만
 * 말할 수 있고 «그래서 어떤 값이 이기는가» 는 원리적으로 말하지 못한다.
 *
 * 🔴그 간극에서 결함이 실제로 살아 있었다: 게시되는 `themes/shadcn.css` 가 토큰을
 *   `:root` 로 덮고 있었는데, **`:root` 는 여기서 이기지 못한다.** `:root` 선언은 위젯에
 *   «상속값» 으로 도달하고, 상속값은 그 요소 자신에 붙은 선언(`:host`)을 절대 이기지
 *   못하기 때문이다. 즉 그 테마를 로드해도 **아무 값도 바뀌지 않았다.**
 *
 * 아래 스위트가 그 규칙 셋을 못 박는다:
 *   ⑴ `:root` 는 진다 (네거티브 — 결함이 되돌아오면 여기서 발화한다)
 *   ⑵ 태그 목록은 `:where()` 로 특이도 0 이어도 이긴다
 *   ⑶ 소비자의 브랜드 규칙은 그 프리셋을 다시 이긴다 (층이 셋이다)
 */

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};

/** 이 패키지가 등록하는 태그 전부 — 프리셋 선택자가 덮어야 하는 집합. */
const TAGS = [
  'u-widget', 'uw-chart', 'uw-citation', 'uw-code', 'uw-compose', 'uw-content',
  'uw-form', 'uw-gallery', 'uw-gauge', 'uw-kv', 'uw-math', 'uw-metric',
  'uw-rating', 'uw-status', 'uw-steps', 'uw-table', 'uw-video',
] as const;

const TAG_LIST = TAGS.join(', ');

let host: HTMLElement;
const sheets: HTMLStyleElement[] = [];

const addSheet = (css: string) => {
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
  sheets.push(s);
};

/** 위젯 호스트에서 실제로 해석된 토큰 값. */
const token = (name: string) => getComputedStyle(host).getPropertyValue(name).trim();

describe('테마 캐스케이드 — 바깥 시트가 `:host` 기본값을 이기는가', () => {
  beforeEach(async () => {
    host = document.createElement('u-widget');
    document.body.appendChild(host);
    await settle();
  });

  afterEach(() => {
    document.body.replaceChildren();
    sheets.splice(0).forEach((s) => s.remove());
  });

  it('기본값은 `:host` 에서 온다 (기준선)', () => {
    expect(token('--u-widget-primary')).toBe('#4f46e5');
  });

  it('🔴`:root` 로 덮으면 **지지 않고 진다** — 상속값은 `:host` 선언을 못 이긴다', async () => {
    addSheet(':root { --u-widget-primary: rgb(255, 0, 0); }');
    await settle();
    // 이 단언이 실패한다면 브라우저 동작이 바뀐 것이다 — 그때는 아래 ⑵의 근거를 다시 읽어야 한다.
    expect(token('--u-widget-primary')).toBe('#4f46e5');
  });

  it('🔴태그 목록은 `:where()` 로 특이도가 0 이어도 이긴다 — 바깥 트리 우선이 특이도보다 먼저다', async () => {
    addSheet(`:where(${TAG_LIST}) { --u-widget-primary: rgb(255, 0, 0); }`);
    await settle();
    expect(token('--u-widget-primary')).toBe('rgb(255, 0, 0)');
  });

  it('소비자 브랜드 규칙은 그 프리셋을 다시 이긴다 — 층이 셋이다', async () => {
    addSheet(`:where(${TAG_LIST}) { --u-widget-primary: rgb(255, 0, 0); }`);
    addSheet('u-widget { --u-widget-primary: rgb(0, 0, 255); }');
    await settle();
    expect(token('--u-widget-primary')).toBe('rgb(0, 0, 255)');
  });

  it('`var(하우스토큰, 기본값)` 브리지가 하우스 값을 따라간다', async () => {
    addSheet(':root { --u-probe-color: rgb(0, 128, 0); }');
    addSheet(`:where(${TAG_LIST}) { --u-widget-primary: var(--u-probe-color, #4f46e5); }`);
    await settle();
    expect(token('--u-widget-primary')).toBe('rgb(0, 128, 0)');
  });

  it('🔴브리지인데 하우스 토큰이 없으면 폴백이 standalone 기본값을 지킨다', async () => {
    addSheet(`:where(${TAG_LIST}) { --u-widget-primary: var(--u-probe-absent, #4f46e5); }`);
    await settle();
    // ⚠폴백을 생략하면 «보장된 무효» 가 되어 `:host` 기본값으로 돌아가지 **않는다** —
    //   바깥 선언이 이미 이겼기 때문이다. 프리셋의 모든 줄에 폴백이 있는 이유가 이것이다.
    expect(token('--u-widget-primary')).toBe('#4f46e5');
  });
});

describe('게시되는 테마 시트가 실제로 적용된다', () => {
  afterEach(() => {
    document.body.replaceChildren();
    sheets.splice(0).forEach((s) => s.remove());
  });

  for (const tag of TAGS) {
    it(`components 브리지가 \`<${tag}>\` 에 닿는다`, async () => {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      addSheet(':root { --u-primary-color: rgb(25, 118, 210); }');
      // 프리셋 본문과 «같은 형태» 를 쓴다 — 시트 자체를 import 하면 vitest 가
      // CSS 를 번들에 넣는 방식에 의존하게 되어, 재는 대상이 캐스케이드가 아니라
      // 번들러가 된다.
      addSheet(`:where(${TAG_LIST}) { --u-widget-primary: var(--u-primary-color, #4f46e5); }`);
      await new Promise((r) => setTimeout(r, 20));
      expect(getComputedStyle(el).getPropertyValue('--u-widget-primary').trim())
        .toBe('rgb(25, 118, 210)');
    });
  }
});
