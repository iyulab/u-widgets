import { test, expect, type Page } from '@playwright/test';

/**
 * **크기 계약 회귀** — 「소비자가 호스트에 높이를 주면 그 제약이 위젯 내부까지 닿는가」.
 *
 * ## 왜 e2e 인가
 *
 * 이 패키지의 vitest 는 `environment: 'happy-dom'` 이라 `getBoundingClientRect` 가 전부 0 을
 * 돌려준다 ⇒ 배치는 여기서만 잴 수 있다(`target-size.spec.ts` 와 같은 근거).
 * ⚠**기존 유닛 테스트가 이 축을 지키고 있다고 오해하지 말 것** — `tokens.test.ts` 는
 * `--u-widget-chart-height:` 라는 **문자열이 시트에 있다**를 단언하고 `uw-chart.test.ts` 는
 * ECharts 를 mock 한다. ***emit 되는 문자열은 배치가 아니다.***
 *
 * ## 무엇이 결함이었나 (cycle-568 실측)
 *
 * 전 위젯이 `:host { display: block }` 이고 내부 컨테이너가 호스트 높이를 받지 않아,
 * 호스트에 `max-height: 200px` 를 주면 **레이아웃은 200px 로 계산되는데 페인트는 원래 높이**가
 * 나왔다. `:host` 에 `overflow` 를 건 위젯이 하나도 없어 **잘리지도 않고 이웃을 덮었다**
 * (차트 11종 각 +100px · `code` +2203 · `table` +1234).
 *
 * ## 픽스처가 아니라 데모의 실제 spec 을 복제한다
 *
 * 손으로 쓴 spec 은 실물과 어긋날 수 있고, 렌더 실패를 「결함」으로 오독하게 만든다.
 * ⇒ 데모 페이지에 실재하는 `u-widget` 에서 spec 을 읽어 복제한다. 못 찾으면 **통과가 아니라
 * 실패**로 낸다(공허한 초록을 만들지 않는다).
 */

interface Spec { widget: string; data?: unknown; options?: unknown }

/** 재는 것: 호스트 상자 · 내부 대상 · 「내부가 호스트 밖으로 나간 양」 · 실제 스크롤 여부. */
interface Measured {
  host: number;
  overflowPx: number;
  inner: number | null;
  scrolled: boolean;
}

async function ready(page: Page) {
  await page.goto('/demo/');
  await page.waitForFunction(() => customElements.get('u-widget') !== undefined, { timeout: 15_000 });
  await page.waitForTimeout(1500);
}

async function measure(
  page: Page,
  widget: string,
  hostStyle: string,
  innerSel: string,
  repeat: number,
): Promise<Measured> {
  return page.evaluate(
    async ({ widget, hostStyle, innerSel, repeat }) => {
      const found = (Array.from(document.querySelectorAll('u-widget')) as (HTMLElement & {
        spec?: Spec;
      })[]).find((h) => h.spec?.widget === widget);
      if (!found?.spec) throw new Error(`데모에 ${widget} spec 이 없다 — 이 판정은 공허하다`);

      const spec = JSON.parse(JSON.stringify(found.spec)) as Spec;
      if (repeat > 1) {
        if (Array.isArray(spec.data)) {
          const rows = spec.data as unknown[];
          spec.data = Array.from({ length: repeat }, (_, i) => rows[i % rows.length]);
        } else if (spec.data && typeof spec.data === 'object') {
          const d = spec.data as Record<string, unknown>;
          for (const k of ['content', 'text', 'code']) {
            if (typeof d[k] === 'string') {
              d[k] = Array.from({ length: repeat }, (_, i) => `line ${i} of padding text`).join('\n');
            }
          }
        }
      }

      const stage = document.createElement('div');
      stage.setAttribute('style', 'position:absolute;top:0;left:0;width:600px');
      const host = document.createElement('u-widget') as HTMLElement & { spec?: Spec };
      if (hostStyle) host.setAttribute('style', hostStyle);
      host.spec = spec;
      stage.appendChild(host);
      document.body.appendChild(stage);
      await new Promise((r) => setTimeout(r, 700));

      const hr = host.getBoundingClientRect();
      let deepest = hr.bottom;
      let target: HTMLElement | null = null;

      /* 🔴클립 경계를 넘어서 세지 않는다. overflow 가 visible 이 아닌 요소의 «안쪽»은 그
         상자로 잘리므로, 그것까지 세면 **정상 동작하는 스크롤 컨테이너가 「유출」로 잡힌다**
         — 실측(cycle-568): `.code-body` 가 161px 로 수축하고 scrollTop 도 남는데 2202px
         유출로 보고됐다. ***넘침 측정은 클리핑을 증명하지 않는다***(cycle-563 「넘침 측정은
         스크롤 컨테이너를 증명하지 않는다」의 거울상).
         ⚠클립하는 상자 «자신» 은 여전히 센다 — 수축에 실패하면 그 상자가 호스트를 넘고,
         그것이 바로 이 회귀가 잡아야 하는 결함이다(네거티브 컨트롤이 여기서 성립한다). */
      const clips = (el: Element) => {
        const cs = getComputedStyle(el);
        return cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
      };
      const walk = (root: ParentNode) => {
        for (const el of Array.from(root.children)) {
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.bottom > deepest) deepest = r.bottom;
          if (!target && el.matches(innerSel)) target = el as HTMLElement;
          if (clips(el)) continue;
          const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) walk(sr);
          walk(el);
        }
      };
      walk(host.shadowRoot ?? host);

      /* 스크롤 주인은 «자기가 클립하는» 요소라 위 순회가 그 자손까지 내려가지 않는다.
         대상이 그 안쪽이면 여기서 따로 찾는다 — 못 찾으면 단언이 공허해진다. */
      if (!target) {
        const find = (root: ParentNode): HTMLElement | null => {
          const hit = root.querySelector(innerSel);
          if (hit) return hit as HTMLElement;
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
            if (sr) { const d = find(sr); if (d) return d; }
          }
          return null;
        };
        target = find(host.shadowRoot ?? host);
      }

      // 🔴「넘침이 0」은 스크롤 컨테이너를 증명하지 않는다 — scrollTop 이 실제로 남는지 잰다.
      let scrolled = false;
      if (target) {
        const t = target as HTMLElement;
        t.scrollTop = 50;
        await new Promise((r) => setTimeout(r, 100));
        scrolled = t.scrollTop > 0;
      }

      const out = {
        host: Math.round(hr.height),
        overflowPx: Math.round(deepest - hr.bottom),
        inner: target ? Math.round((target as HTMLElement).getBoundingClientRect().height) : null,
        scrolled,
      };
      stage.remove();
      return out;
    },
    { widget, hostStyle, innerSel, repeat },
  );
}

test.describe('크기 계약 — 호스트 제약이 내부에 닿는다', () => {
  test('uw-chart — 호스트 높이가 차트 영역의 높이가 된다', async ({ page }) => {
    await ready(page);

    // ⑴ 제약이 없으면 종전 기본값 300px 그대로다(이 수정이 기본 모습을 바꾸지 않았다는 증거).
    const nat = await measure(page, 'chart.bar', '', '.chart-container', 1);
    expect(nat.inner, `자연 높이 실측 ${JSON.stringify(nat)}`).toBe(300);
    expect(nat.overflowPx).toBeLessThanOrEqual(1);

    // ⑵ 호스트가 더 작으면 차트가 수축한다 — 종전에는 300px 를 유지해 100px 가 새어 나왔다.
    const small = await measure(page, 'chart.bar', 'height:200px', '.chart-container', 1);
    expect(small.overflowPx, `실측 ${JSON.stringify(small)}`).toBeLessThanOrEqual(1);
    expect(small.inner).toBeLessThanOrEqual(200);

    // ⑶ 호스트가 더 크면 차트가 그 높이를 채운다 — 리터럴 300px 에 갇히지 않는다.
    const big = await measure(page, 'chart.bar', 'height:400px', '.chart-container', 1);
    expect(big.inner, `실측 ${JSON.stringify(big)}`).toBeGreaterThan(300);
    expect(big.overflowPx).toBeLessThanOrEqual(1);
  });

  test('uw-table — 호스트 제약이 표 래퍼를 스크롤 컨테이너로 만든다', async ({ page }) => {
    await ready(page);

    const nat = await measure(page, 'table', '', '.table-wrapper', 40);
    expect(nat.overflowPx, `자연 성장 실측 ${JSON.stringify(nat)}`).toBeLessThanOrEqual(1);
    expect(nat.inner!, '제약이 없으면 40행이 그대로 자라는 것이 이 위젯의 계약이다')
      .toBeGreaterThan(600);

    const capped = await measure(page, 'table', 'max-height:200px', '.table-wrapper', 40);
    expect(capped.overflowPx, `실측 ${JSON.stringify(capped)}`).toBeLessThanOrEqual(1);
    expect(capped.inner!).toBeLessThanOrEqual(200);
    expect(capped.scrolled, '넘침이 0 이어도 스크롤이 안 되면 행에 도달할 수 없다').toBe(true);
  });

  test('uw-code — 호스트 제약이 코드 본문을 스크롤 컨테이너로 만든다', async ({ page }) => {
    await ready(page);

    const nat = await measure(page, 'code', '', '.code-body', 120);
    expect(nat.overflowPx, `자연 성장 실측 ${JSON.stringify(nat)}`).toBeLessThanOrEqual(1);

    const capped = await measure(page, 'code', 'max-height:200px', '.code-body', 120);
    expect(capped.overflowPx, `실측 ${JSON.stringify(capped)}`).toBeLessThanOrEqual(1);
    expect(capped.inner!).toBeLessThanOrEqual(200);
    expect(capped.scrolled, '`overflow:auto` 가 선언돼 있다는 것이 스크롤 컨테이너라는 뜻은 아니다')
      .toBe(true);
  });
});
