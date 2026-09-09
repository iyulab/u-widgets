import { test, expect, type Page } from '@playwright/test';

/**
 * **WCAG 2.2 SC 2.5.8 Target Size (Minimum) — 24×24 CSS px** 게이트.
 *
 * ## 왜 여기(e2e)에 있는가
 *
 * 타깃 크기는 **렌더된 성질**이라 실제 브라우저에서만 잴 수 있는데, 이 패키지의 vitest 는
 * `environment: 'happy-dom'` 이라 `getBoundingClientRect` 가 **전부 0** 을 돌려준다.
 * ⇒ 새 의존(브라우저 러너)을 들이는 대신 **이미 있는 Playwright e2e 인프라**에 얹었다.
 *
 * ## 🔴 대상은 «도출»하고 규칙만 «손으로 쓴다»
 *
 * 등록된 태그를 손으로 열거하면 새 위젯이 조용히 시야 밖에 남는다. ⇒ `addInitScript` 로
 * **페이지 스크립트보다 먼저** `customElements.define` 을 가로채 등록된 것을 전부 얻는다.
 *
 * ⚠**개발 서버가 자기 엘리먼트를 등록한다** — Vite 의 `vite-error-overlay` 가 그것이고,
 * 우리 것이 아니므로 접두(`u-`/`uw-`)로 거른다. ***도출은 «우리 것만»을 뜻하지 않는다.***
 *
 * ## 픽스처가 아니라 «데모 페이지»를 잰다
 *
 * 빈 위젯(`<uw-form></uw-form>`)은 **높이 0** 이라 아무것도 재지 못한다(실측). 위젯은 `spec`
 * 을 받아야 렌더되므로, 합성 픽스처를 손으로 쓰는 대신 **이미 각 위젯을 실제 데이터로
 * 그리고 있는 데모 페이지**를 잰다 — 픽스처가 실물과 어긋날 여지가 없다는 것이 이 선택의
 * 이유다.
 *
 * 🔴**그 대가는 커버리지가 데모에 달린다는 것**이고, 그래서 **재지 못한 위젯을 이름으로
 * 보고한다**(아래 「커버리지」). ***침묵이 아니라 «할 일이 있다»는 신호다.***
 *
 * ## ⚠ 재는 범위
 *
 * «크기»만 잰다. SC 2.5.8 의 **간격 예외는 적용하지 않는다** — 그 예외는 *"주변에 다른 타깃이
 * 24px 안에 없다"* 를 요구하는데, 위젯이 페이지 어디에 어떻게 놓이는지는 **소비앱이 정한다**
 * (이 판단의 근거는 `components` 쪽 게이트가 네거티브 컨트롤로 확인했다 — 고립 상태를
 * 통과로 세면 무엇이든 통과한다).
 */

/** 상호작용 요소 — 사용자가 활성화하는 것. */
const INTERACTIVE =
  'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

const MIN = 24;

/**
 * 🔴**측정 결과 미달인데 «올리면 눈에 보이는» 것 — 사람 판단 대기.**
 *
 * - `uw-code` — 복사 버튼이 **48×21**. `.code-copy` 는 테두리·배경을 가진 **보이는 버튼**이라
 *   히트 영역만 넓히는 처방(`components` 의 checkbox·chip 에 쓴 것)이 여기서는 성립하지
 *   않는다 — 넓히면 버튼 자체가 커진다. ⇒ 시각적 공개 계약 변경이라 자율 착수 금지 축이다.
 * - `uw-form` — 네이티브 `input[checkbox]`/`input[radio]` 가 **13×13**(브라우저 기본값,
 *   치수 지정이 없다). ⚠**`components` 의 `u-checkbox` 와 처방이 다르다** — 저쪽은 커스텀
 *   엘리먼트라 호스트에 최소 높이를 줄 수 있었지만, 여기는 **네이티브 입력 자체**라 크기를
 *   주면 체크 표시가 그만큼 커진다(브라우저가 글리프를 박스에 맞춰 그린다). 라벨 행 전체를
 *   타깃으로 삼는 재구조화가 정석인데 그것은 마크업 변경이다 ⇒ 사람 판단.
 *
 * 여기 있는 동안 이 파일은 그것을 **미달로 단언**하므로 스위트는 초록이고, 치수를 올리면
 * 빨개진다 — 그때 이 목록에서 빼는 것이 완료 신호다.
 */
const UNDERSIZED_PINS = new Set(['uw-code', 'uw-form']);

/**
 * SC 2.5.8 **「인라인」 예외** — 문장 안에 놓인 타깃은 규격이 명시적으로 면제한다.
 * 이 위젯들의 `a[href]` 는 본문 산문 안의 링크라(실측 `uw-content` 의 31×18) 자를 대면
 * ***정당한 산문에 발화***한다. ⚠**면제는 `a[href]` 에만** 적용한다 — 같은 위젯 안의 버튼은
 * 인라인이 아니다.
 */
const INLINE_PROSE = new Set(['uw-content', 'uw-citation']);

interface Target {
  owner: string;
  tag: string;
  w: number;
  h: number;
}

async function load(page: Page): Promise<string[]> {
  await page.addInitScript(() => {
    (window as unknown as { __registered: string[] }).__registered = [];
    const orig = customElements.define.bind(customElements);
    customElements.define = ((n: string, c: CustomElementConstructor, o?: ElementDefinitionOptions) => {
      (window as unknown as { __registered: string[] }).__registered.push(n);
      return orig(n, c, o);
    }) as typeof customElements.define;
  });

  await page.goto('/demo/');
  await page.waitForFunction(() => customElements.get('u-widget') !== undefined, { timeout: 15_000 });
  await page.waitForTimeout(1500);

  return page.evaluate(() =>
    (window as unknown as { __registered: string[] }).__registered
      .filter((n) => n.startsWith('u-') || n.startsWith('uw-'))
      .sort(),
  );
}

async function collectTargets(page: Page, interactive: string): Promise<Target[]> {
  return page.evaluate((sel) => {
    const found: { owner: string; tag: string; w: number; h: number }[] = [];

    function walk(root: ParentNode, owner: string) {
      for (const el of Array.from(root.querySelectorAll('*'))) {
        const tag = el.tagName.toLowerCase();
        const nextOwner = tag.startsWith('uw-') || tag === 'u-widget' ? tag : owner;
        if (el.matches(sel)) {
          const r = el.getBoundingClientRect();
          // 숨겨진 것은 타깃이 아니다 — 열린 상태에서만 존재하는 컨트롤이 여기 걸린다.
          if (r.width > 0 || r.height > 0) {
            const kind = tag === "input" ? tag + "[" + ((el as HTMLInputElement).type || "text") + "]" : tag;
            found.push({ owner: nextOwner, tag: kind, w: r.width, h: r.height });
          }
        }
        const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
        if (sr) walk(sr, nextOwner);
      }
    }

    walk(document.body, 'page');
    return found;
  }, interactive);
}

test.describe('WCAG 2.2 SC 2.5.8 — 타깃 크기(최소)', () => {
  test('위젯이 소유한 상호작용 타깃이 24×24 하한을 만족한다', async ({ page }) => {
    const registered = await load(page);
    expect(registered.length, '도출이 0건이면 아래 단언이 전부 공허해진다').toBeGreaterThan(10);

    const all = await collectTargets(page, INTERACTIVE);
    // ⚠데모 페이지 자신의 크롬(네비게이션 링크 등)은 우리 계약이 아니다.
    const ours = all.filter((t) => t.owner !== 'page');
    expect(ours.length, '위젯이 소유한 타깃을 하나도 못 찾으면 이 판정은 무의미하다')
      .toBeGreaterThan(0);

    const violations = ours.filter((t) => {
      if (t.w >= MIN && t.h >= MIN) return false;
      if (INLINE_PROSE.has(t.owner) && t.tag === 'a') return false; // 인라인 예외
      return true;
    });

    const unexpected = violations.filter((t) => !UNDERSIZED_PINS.has(t.owner));
    expect(
      unexpected.map((t) => `${t.owner}>${t.tag} ${Math.round(t.w)}x${Math.round(t.h)}`),
      '핀에 없는 새 미달이다 — 고치거나, 시각 계약 변경이면 핀에 넣고 사람에게 올릴 것',
    ).toEqual([]);
  });

  test('📌미달 재고 — 핀이 실제 미달과 일치한다 (사람 판단 대기)', async ({ page }) => {
    await load(page);
    const ours = (await collectTargets(page, INTERACTIVE)).filter((t) => t.owner !== 'page');

    // ⚠**핀이다** — 치수를 올리면 이 단언이 빨개지고, 그것이 완료 신호다.
    for (const owner of UNDERSIZED_PINS) {
      const mine = ours.filter((t) => t.owner === owner);
      expect(mine.length, `${owner} 의 타깃을 못 찾았다 — 데모가 바뀌었으면 핀을 재검토할 것`)
        .toBeGreaterThan(0);
      expect(
        mine.some((t) => t.w < MIN || t.h < MIN),
        `${owner} 실측 ${mine.map((t) => `${Math.round(t.w)}x${Math.round(t.h)}`).join(' ')}`,
      ).toBe(true);
    }
  });

  test('📌커버리지를 보고한다 — 재지 못한 위젯은 「통과」가 아니다', async ({ page }) => {
    const registered = await load(page);
    const ours = (await collectTargets(page, INTERACTIVE)).filter((t) => t.owner !== 'page');
    const measured = new Set(ours.map((t) => t.owner));
    const unmeasured = registered.filter((t) => !measured.has(t)).sort();

    // 🔴이 단언은 «커버리지가 줄지 않았는가»를 지킨다. 데모가 위젯을 더 그리면 이 목록이
    //   줄고, 그때 이 줄을 함께 고치는 것이 그 작업의 완료 신호다.
    expect(`측정 ${measured.size} · 미측정 ${unmeasured.length}(${unmeasured.join(' ')})`)
      .toBe(
        '측정 5 · 미측정 12(uw-chart uw-citation uw-compose uw-gallery uw-gauge uw-kv ' +
        'uw-math uw-metric uw-rating uw-status uw-steps uw-video)',
      );
  });
});
