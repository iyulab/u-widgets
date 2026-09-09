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
 * ✅**지금은 비어 있다** — 신설(cycle-489) 시점의 둘을 cycle-493·494 가 모두 해소했다.
 * 새로 핀을 넣을 때는 **왜 자율로 고칠 수 없는지**(선택지가 둘 이상인 시각 계약 변경인지)를
 * 여기 함께 적을 것.
 *
 * ✅**`uw-code` 는 cycle-494 가 해소했다** — 복사 버튼 **48×21**. 테두리·배경을 가진 «보이는»
 *   버튼이라 히트 영역만 넓히는 처방이 성립하지 않아 **버튼 자체를 24px 하한으로** 올렸다
 *   (사람 결정 §C-A ⑸ ⑴안). 글자 크기·좌우 여백은 그대로다.
 * ✅**`uw-form` 은 cycle-493 이 해소했다 — 그리고 세 갈림길이 전부 틀린 전제 위에 있었다.**
 *   *"네이티브 입력 자체라 크기를 주면 글리프가 커진다"* 는 맞지만, ***애초에 입력이 타깃이***
 *   ***아니었다*** — 입력은 `<label>` 에 감싸여 있어 라벨을 눌러도 토글된다. 즉 SC 2.5.8 이
 *   재는 영역은 라벨 행(실측 **343×19**)이고, 모자란 것은 **높이 5px** 뿐이었다. ⇒ 마크업
 *   재구조화도 `appearance` 커스텀 렌더도 필요 없이 라벨에 `min-block-size` 하한 하나로 닫혔고,
 *   **이 파일이 입력이 아니라 라벨을 재도록** 함께 고쳤다(`collectTargets` 참조).
 *   ⚠교훈: ***「고칠 수 없다」로 보이면 「재는 대상이 맞는가」를 먼저 의심할 것.***
 *
 * 여기 있는 동안 이 파일은 그것을 **미달로 단언**하므로 스위트는 초록이고, 치수를 올리면
 * 빨개진다 — 그때 이 목록에서 빼는 것이 완료 신호다.
 */
const UNDERSIZED_PINS = new Set<string>([]);

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
          // 🔴**체크박스·라디오의 포인터 타깃은 입력 자체가 아니라 «활성화 라벨»이다.**
          //   라벨을 누르면 토글되므로 SC 2.5.8 이 재는 「포인터 동작을 받는 영역」은 라벨
          //   전체다(네이티브 입력은 13x13 이지만 라벨 행은 그보다 훨씬 크다).
          //   ⚠**규칙이라 손으로 쓴다** — 어떤 라벨이 «활성화»하는지는 도출이 아니라 우리
          //   지식이다. 그리고 **체크박스·라디오에만** 적용한다: 텍스트 입력의 라벨은 클릭
          //   시 포커스만 주고 그 입력은 어차피 자기 크기로 충분하므로, 넓히면 정당한 미달을
          //   숨기는 쪽으로만 작용한다.
          const input = el as HTMLInputElement;
          const usesLabel =
            el.tagName === 'INPUT' && (input.type === 'checkbox' || input.type === 'radio');
          const measured = (usesLabel && input.labels?.[0]) || el;
          const r = measured.getBoundingClientRect();
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
    /* 🔴**빈 집합에서는 아래 루프가 아무것도 단언하지 않는다** — 「초록인데 아무것도 안 재는」
       상태다. 그래서 비어 있다는 사실 자체를 먼저 단언한다: 누군가 핀을 다시 넣으면 이 줄이
       빨개져 «사람 판단 대기 항목이 생겼다»를 명시적으로 알린다. */
    expect([...UNDERSIZED_PINS].sort(), '핀이 늘었다 — 사람 판단 대기 항목이 생겼다는 뜻이다').toEqual([]);

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

  /* §C-A ⑸ 의 `uw-form` 절반 (cycle-493). ⚠**두 축을 함께 재지 않으면 이 결정을 검증할 수
     없다** — 라벨만 재면 「글리프까지 커졌다」를, 입력만 재면 「타깃이 안 커졌다」를 통과시킨다.
     입력에 치수를 주지 않았다는 것이 이 처방의 핵심이므로 13×13 을 명시적으로 고정한다. */
  test('uw-form — 타깃(라벨)은 24px 하한을 넘고, 네이티브 입력은 브라우저 기본값 그대로다', async ({ page }) => {
    await load(page);
    const rows = await page.evaluate(() => {
      const out: { label: [number, number]; input: [number, number] }[] = [];
      const walk = (root: ParentNode) => {
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (el.tagName === 'INPUT') {
            const i = el as HTMLInputElement;
            if ((i.type === 'checkbox' || i.type === 'radio') && i.labels?.[0]) {
              const l = i.labels[0].getBoundingClientRect();
              const r = i.getBoundingClientRect();
              out.push({ label: [l.width, l.height], input: [r.width, r.height] });
            }
          }
          const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) walk(sr);
        }
      };
      walk(document.body);
      return out;
    });

    expect(rows.length, '데모에 체크박스/라디오가 하나도 없으면 이 판정은 공허하다').toBeGreaterThan(0);
    for (const r of rows) {
      expect(Math.round(r.label[1]), `라벨 ${r.label.map(Math.round).join('x')}`).toBeGreaterThanOrEqual(MIN);
      expect(Math.round(r.input[1]), '입력에 치수를 주면 브라우저가 체크 글리프를 함께 키운다')
        .toBeLessThan(MIN);
    }
  });

  /* §C-A ⑸ 의 `uw-code` 절반 (cycle-494). 여기서 재는 두 축은 「높이는 올랐는가」와
     「그 대가로 버튼이 옆으로 부풀지는 않았는가」다 — 후자를 재지 않으면 «작은 유틸 버튼
     감각을 유지한다»는 이 결정의 조건이 검증되지 않는다. */
  test('uw-code — 복사 버튼이 24px 하한을 넘고, 가로는 그대로다', async ({ page }) => {
    await load(page);
    const rects = await page.evaluate(() => {
      const out: [number, number][] = [];
      const walk = (root: ParentNode) => {
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (el.classList?.contains('code-copy')) {
            const r = el.getBoundingClientRect();
            out.push([r.width, r.height]);
          }
          const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (sr) walk(sr);
        }
      };
      walk(document.body);
      return out;
    });

    expect(rects.length, '데모에 코드블록이 없으면 이 판정은 공허하다').toBeGreaterThan(0);
    for (const [w, h] of rects) {
      expect(Math.round(h), `실측 ${Math.round(w)}x${Math.round(h)}`).toBeGreaterThanOrEqual(MIN);
      expect(Math.round(w), '가로가 부풀었다면 「좌우 여백은 그대로」라는 전제가 깨진 것이다')
        .toBeLessThanOrEqual(56);
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
