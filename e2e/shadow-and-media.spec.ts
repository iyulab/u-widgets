import { test, expect, type Page } from '@playwright/test';

/**
 * 실브라우저에서만 보이는 두 가지 — vitest(happy-dom)는 계산된 스타일도 네트워크 요청도 내지 못한다.
 *
 * 1. 다른 요소의 shadow root 안의 `<u-widget>`이 페이지 테마를 받는다(계산된 `--u-widget-text`가 light DOM 위젯과 같다).
 * 2. `setMediaOrigins`를 걸면 목록 밖 URL에는 요청 자체가 나가지 않는다(요청 기록으로 잰다). 같은 시험의 «걸지 않은» 쪽이
 *    요청이 실제로 관측됨을 보인다 — 관측이 안 되는 시험이 «요청 없음»으로 초록이 되는 것을 막는다.
 */

/** 브라우저의 dev 서버가 내주는 진입점 주소 — 타입 검사가 따라가지 못하도록 값으로 넘긴다(`tsc`는 e2e도 본다). */
const ENTRY = '/src/index.ts';

/**
 * 데모 페이지를 열어 둔다. 데모는 요소만 가져오고(`src/elements/u-widget.ts`) 진입점은 가져오지 않아 테마 동기화가
 * 설치돼 있지 않다 — 진입점(`src/index.ts`)을 동적으로 가져오는 것이 라이브러리를 «쓰는» 호스트의 상태다(진입점이
 * 가져와질 때 동기화가 설치된다). 같은 URL이라 `page.evaluate`가 가져오는 것도 같은 모듈 인스턴스다.
 */
async function open(page: Page) {
  await page.goto('/demo/widgets.html');
  await page.waitForSelector('u-widget');
  await page.evaluate(async entry => { await import(/* @vite-ignore */ entry); }, ENTRY);
}

test.describe('shadow root 안의 위젯의 테마', () => {
  test('light DOM 위젯과 같은 다크 토큰을 받는다', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const make = () => {
        const el = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
        el.spec = { widget: 'metric', title: 'x', data: { value: 1.8, unit: 's' } };
        return el;
      };
      const light = make();
      document.body.appendChild(light);
      const host = document.createElement('div');
      document.body.appendChild(host);
      const inShadow = make();
      host.attachShadow({ mode: 'open' }).appendChild(inShadow);
      await Promise.all([light.updateComplete, inShadow.updateComplete]);
      await new Promise(resolve => setTimeout(resolve, 50));
      const text = (el: Element) => getComputedStyle(el).getPropertyValue('--u-widget-text').trim();
      document.documentElement.setAttribute('data-theme', 'light');
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        darkLight: light.getAttribute('theme'),
        darkShadow: inShadow.getAttribute('theme'),
        textShadowAfterSwitch: text(inShadow),
        textLightAfterSwitch: text(light),
      };
    });
    expect(result.darkLight).toBe('light'); // 이어서 light로 바꾼 뒤의 값 — 둘 다 선언을 따라간다
    expect(result.darkShadow).toBe('light');
    expect(result.textShadowAfterSwitch).toBe(result.textLightAfterSwitch);
  });

  test('다크 선언 직후 shadow 안 위젯의 글자색은 라이트 기본값(#1a1a2e)이 아니다', async ({ page }) => {
    await open(page);
    const text = await page.evaluate(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const host = document.createElement('div');
      document.body.appendChild(host);
      const el = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
      el.spec = { widget: 'metric', title: 'x', data: { value: 1.8, unit: 's' } };
      host.attachShadow({ mode: 'open' }).appendChild(el);
      await el.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 50));
      return getComputedStyle(el).getPropertyValue('--u-widget-text').trim().toLowerCase();
    });
    expect(text).not.toBe('#1a1a2e');
    expect(text).not.toBe('');
  });
});

test.describe('미디어 출처', () => {
  const SECRET = 'q=SECRET-4c1f';

  async function drawMedia(page: Page, origins: string[] | null) {
    const requests: string[] = [];
    page.on('request', r => { if (r.url().includes(SECRET)) requests.push(r.url()); });
    await open(page);
    await page.evaluate(async ({ origins, secret, entry }) => {
      const lib = await import(/* @vite-ignore */ entry);
      lib.setMediaOrigins(origins);
      const draw = (spec: unknown) => {
        const el = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
        el.spec = spec;
        document.body.appendChild(el);
        return el.updateComplete;
      };
      await draw({ widget: 'image', data: { src: `http://127.0.0.1:9/a.png?${secret}`, alt: 'plan' } });
      await draw({ widget: 'gallery', data: [{ src: `http://127.0.0.1:9/b.png?${secret}`, alt: 'g' }] });
      await new Promise(resolve => setTimeout(resolve, 500));
    }, { origins, secret: SECRET, entry: ENTRY });
    return requests;
  }

  test('걸지 않으면 요청이 나간다(관측이 되는지의 대조)', async ({ page }) => {
    const requests = await drawMedia(page, null);
    expect(requests.length).toBeGreaterThanOrEqual(2);
  });

  test('목록 밖 URL에는 요청이 나가지 않고 alt가 대신 그려진다', async ({ page }) => {
    const requests = await drawMedia(page, ['self']);
    expect(requests).toEqual([]);
    const blocked = await page.evaluate(() => {
      const found: string[] = [];
      document.querySelectorAll('u-widget').forEach(el => {
        const inner = el.shadowRoot?.querySelector('uw-content, uw-gallery');
        const note = inner?.shadowRoot?.querySelector('[part="blocked"]');
        if (note?.textContent) found.push(note.textContent);
      });
      return found;
    });
    expect(blocked).toEqual(expect.arrayContaining(['plan', 'g']));
  });
});
