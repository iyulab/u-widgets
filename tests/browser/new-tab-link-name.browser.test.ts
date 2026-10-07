/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import '../../src/index.js';
import { registerLocale } from '../../src/core/locale.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * 새 창으로 여는 링크는 그 사실을 미리 알려야 한다(KWCAG 7.2.1 사용자 요구에 따른 실행).
 * 인용 카드와 마크다운 링크가 `target="_blank"` 인데 스크린리더에는 아무 말이 없었다 — 접근성
 * 이름 끝에 로케일 문구를 붙인다(화면에는 보이지 않는다). 실제 접근성 트리로 잰다.
 */
describe('u-widgets 새 창 링크의 접근성 이름', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  async function mount(tag: string, spec: UWidgetSpec) {
    const el = document.createElement(tag) as HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };
    el.spec = spec;
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  it('uw-citation — 인용 링크의 이름 끝에 알림이 붙는다', async () => {
    await mount('uw-citation', { widget: 'citation', data: [{ title: 'Source A', url: 'https://example.com/a' }] });
    await expect.element(page.getByRole('link', { name: /Source A.*\(opens in a new tab\)$/ })).toBeInTheDocument();
  });

  it('uw-content — 마크다운 링크의 이름 끝에 알림이 붙는다', async () => {
    await mount('uw-content', { widget: 'markdown', data: { content: 'See [the guide](https://example.com/g).' } });
    await expect.element(page.getByRole('link', { name: 'the guide (opens in a new tab)' })).toBeInTheDocument();
  });

  it('등록한 로케일을 따른다 — 문구는 HTML 로 해석되지 않는다', async () => {
    registerLocale('ko', { opensInNewTab: '(새 창 <b>열림</b>)' });
    await mount('uw-content', {
      widget: 'markdown',
      data: { content: '[안내](https://example.com/g)' },
      options: { locale: 'ko' },
    });
    await expect.element(page.getByRole('link', { name: '안내 (새 창 <b>열림</b>)' })).toBeInTheDocument();
  });

  it('화면에는 보이지 않는다', async () => {
    const el = await mount('uw-citation', { widget: 'citation', data: [{ title: 'Source A', url: 'https://example.com/a' }] });
    const hint = el.shadowRoot!.querySelector('.new-tab-hint')!;
    const r = hint.getBoundingClientRect();
    expect(r.width <= 1 && r.height <= 1).toBe(true);
  });

  /**
   * 그 문구는 절대 위치 상자다 — 요소 안에 위치 지정된 조상이 없으면 포함 블록이 문서 전체가 되어 호스트의 `overflow` 감싸개를
   * 건너뛰고 문서를 늘린다(채팅 목록처럼 위치 지정되지 않은 스크롤 상자 안에서). 판정: 문구의 `offsetParent` 가 `body` 가 아니다.
   */
  for (const [tag, spec] of [
    ['uw-citation', { widget: 'citation', data: [{ title: 'Source A', url: 'https://example.com/a' }] }],
    ['uw-content', { widget: 'markdown', data: { content: 'See [the guide](https://example.com/g).' } }],
  ] as const) {
    it(`${tag} — 문구는 요소 안에 갇힌다(스크롤 상자를 건너 문서를 늘리지 않는다)`, async () => {
      const box = document.createElement('div');
      box.style.cssText = 'height: 100px; overflow: auto;';
      const spacer = document.createElement('div');
      spacer.style.height = '3000px';
      box.appendChild(spacer);
      document.body.appendChild(box);
      const el = document.createElement(tag) as HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };
      el.spec = spec as UWidgetSpec;
      box.appendChild(el);
      await el.updateComplete;
      const hint = el.shadowRoot!.querySelector('.new-tab-hint') as HTMLElement;
      expect(hint.offsetParent).not.toBe(document.body);
      expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
    });
  }
});
