import { test, expect, type Page } from '@playwright/test';

// ── Helpers ──

/** Wait until <u-widget> custom element is defined */
async function waitForWidgets(page: Page) {
  await page.waitForFunction(
    () => customElements.get('u-widget') !== undefined,
    { timeout: 10_000 },
  );
}

/**
 * Read text from a u-widget's shadow tree, including nested shadow roots.
 * u-widget shadow 직속 텍스트(예: .widget-title)와 내부 컴포넌트(uw-form 등)의
 * shadow 텍스트를 모두 합친다 — 첫 요소만 보는 순회는 title 렌더 시 버튼을 놓친다.
 */
async function deepShadowText(page: Page, id: string): Promise<string> {
  return page.evaluate((hostId) => {
    const host = document.getElementById(hostId);
    if (!host?.shadowRoot) return '';
    const parts: string[] = [host.shadowRoot.textContent?.trim() ?? ''];
    for (const child of host.shadowRoot.querySelectorAll('*')) {
      if (child.shadowRoot) {
        parts.push(child.shadowRoot.textContent?.trim() ?? '');
      }
    }
    return parts.filter(Boolean).join(' ');
  }, id);
}

/**
 * Check if a selector exists in the nested shadow DOM.
 * Searches in: u-widget#shadow → inner-element#shadow → selector
 */
async function deepShadowHas(page: Page, id: string, selector: string): Promise<boolean> {
  return page.evaluate(
    ([hostId, sel]) => {
      const host = document.getElementById(hostId);
      if (!host?.shadowRoot) return false;
      // Direct check in u-widget shadow
      if (host.shadowRoot.querySelector(sel)) return true;
      // Check all child elements' shadow roots
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot?.querySelector(sel)) return true;
      }
      return false;
    },
    [id, selector] as const,
  );
}

/**
 * Query a selector in the nested shadow DOM, returning count.
 */
async function deepShadowCount(page: Page, id: string, selector: string): Promise<number> {
  return page.evaluate(
    ([hostId, sel]) => {
      const host = document.getElementById(hostId);
      if (!host?.shadowRoot) return 0;
      // Check all child elements' shadow roots
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const found = child.shadowRoot.querySelectorAll(sel);
          if (found.length > 0) return found.length;
        }
      }
      // Fallback: check u-widget shadow directly
      return host.shadowRoot.querySelectorAll(sel).length;
    },
    [id, selector] as const,
  );
}

// ── Setup ──

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/');
  await waitForWidgets(page);
  // Allow widgets to render
  await page.waitForTimeout(1000);
});

// ── 1. Smoke Tests ──

test.describe('Smoke', () => {
  test('page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/demo/');
    await waitForWidgets(page);
    expect(errors).toEqual([]);
  });

  test('all u-widget elements are present', async ({ page }) => {
    const count = await page.evaluate(
      () => document.querySelectorAll('u-widget').length,
    );
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('u-widget custom element is defined', async ({ page }) => {
    const defined = await page.evaluate(
      () => customElements.get('u-widget') !== undefined,
    );
    expect(defined).toBe(true);
  });
});

// ── 2. Display Widgets ──

test.describe('Display Widgets', () => {
  test('metric renders value', async ({ page }) => {
    const text = await deepShadowText(page, 'demo-metric');
    expect(text).toContain('1284');
    expect(text).toContain('Total Users');
  });

  test('stat-group renders multiple stats', async ({ page }) => {
    const text = await deepShadowText(page, 'demo-stat-group');
    expect(text).toContain('Active');
    expect(text).toContain('Pending');
    expect(text).toContain('Errors');
  });

  test('stat-group: 7 items with long values never overlap', async ({ page }) => {
    // 회귀 가드: ISSUE-20260713-uwidgets-statgroup-overlap
    // 항목 7개 × 12자리+ 값에서 값 텍스트가 셀 폭을 넘으면(=이웃 셀 침범) 실패.
    const result = await page.evaluate(() => {
      const host = document.getElementById('demo-stat-group-long');
      if (!host?.shadowRoot) return null;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        const metrics = child.shadowRoot?.querySelectorAll('.stat-group .metric');
        if (!metrics?.length) continue;
        const cells = [...metrics].map((m) => {
          const value = m.querySelector('.metric-value') as HTMLElement;
          const rect = m.getBoundingClientRect();
          return {
            top: Math.round(rect.top),
            left: rect.left,
            overflow: value ? value.scrollWidth - value.clientWidth : 0,
          };
        });
        return { count: cells.length, cells };
      }
      return null;
    });

    expect(result).not.toBeNull();
    expect(result!.count).toBe(7);
    // 각 값 텍스트는 자기 셀 안에 들어가야 한다 (1px 반올림 허용)
    for (const [i, cell] of result!.cells.entries()) {
      expect(cell.overflow, `value #${i} overflows its cell by ${cell.overflow}px`)
        .toBeLessThanOrEqual(1);
    }
    // 1280px 뷰포트에서 7개 장문 값은 한 줄에 못 들어간다 — wrap이 실제로 일어나야 함
    const rowTops = new Set(result!.cells.map((c) => c.top));
    expect(rowTops.size).toBeGreaterThanOrEqual(2);
  });

  test('metric variant renders danger color on value', async ({ page }) => {
    // v0.11.9 variant — CSS-text 유닛 가드만으론 토큰 해석/셰도우 적용을 못 본다: 실렌더 색 검증
    const color = await page.evaluate(() => {
      const host = document.getElementById('demo-metric-variant');
      if (!host?.shadowRoot) return null;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        const v = child.shadowRoot?.querySelector('.metric[data-variant="danger"] .metric-value');
        if (v) return getComputedStyle(v).color;
      }
      return null;
    });
    expect(color).toBe('rgb(220, 38, 38)'); // --u-widget-negative default
  });

  test('gauge renders arc', async ({ page }) => {
    const hasSvg = await deepShadowHas(page, 'demo-gauge', 'svg');
    expect(hasSvg).toBe(true);
    const text = await deepShadowText(page, 'demo-gauge');
    expect(text).toContain('73');
  });

  test('progress renders bar', async ({ page }) => {
    const hasBar = await deepShadowHas(page, 'demo-progress', '.progress-bar-track');
    expect(hasBar).toBe(true);
  });
});

// ── 3. Data Widgets ──

test.describe('Data Widgets', () => {
  test('table renders rows', async ({ page }) => {
    const rowCount = await deepShadowCount(page, 'demo-table', 'tbody tr');
    expect(rowCount).toBe(3);
  });

  test('table renders column headers', async ({ page }) => {
    const text = await deepShadowText(page, 'demo-table');
    expect(text).toContain('Name');
    expect(text).toContain('Role');
    expect(text).toContain('Salary');
  });

  test('table column variant highlights cells', async ({ page }) => {
    // v0.12.0 컬럼 variant — 실렌더 색·굵기 검증
    const style = await page.evaluate(() => {
      const host = document.getElementById('demo-table');
      if (!host?.shadowRoot) return null;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        const td = child.shadowRoot?.querySelector('td[data-variant="success"]');
        if (td) {
          const cs = getComputedStyle(td);
          return { color: cs.color, weight: cs.fontWeight };
        }
      }
      return null;
    });
    expect(style).not.toBeNull();
    expect(style!.color).toBe('rgb(22, 163, 74)'); // --u-widget-positive default
    expect(style!.weight).toBe('600');
  });

  test('list renders items', async ({ page }) => {
    const itemCount = await deepShadowCount(page, 'demo-list', '.list-item');
    expect(itemCount).toBe(3);
  });
});

// ── 4. Chart Widgets ──

test.describe('Chart Widgets', () => {
  const chartIds = [
    'demo-chart-bar',
    'demo-chart-hbar',
    'demo-chart-line',
    'demo-chart-area',
    'demo-chart-pie',
    'demo-chart-donut',
    'demo-chart-scatter',
    'demo-chart-box',
    'demo-chart-heatmap',
    'demo-chart-radar',
    'demo-chart-funnel',
    'demo-chart-waterfall',
    'demo-chart-treemap',
  ];

  test('treemap renders visible tiles (not blank)', async ({ page }) => {
    // 회귀 가드: 부모 노드 value:0 강제 주입 시 트리맵이 캔버스는 있지만 빈 화면으로
    // 무음 실패한다 — 캔버스 존재 검사로는 못 잡으므로 픽셀 비율로 검증.
    await page.waitForTimeout(1000);
    const coloredRatio = await page.evaluate(() => {
      const host = document.getElementById('demo-chart-treemap');
      if (!host?.shadowRoot) return -1;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        const canvas = child.shadowRoot?.querySelector('canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return -1;
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let colored = 0;
          for (let i = 0; i < img.length; i += 4) {
            if (img[i + 3] > 0 && !(img[i] > 240 && img[i + 1] > 240 && img[i + 2] > 240)) colored++;
          }
          return colored / (img.length / 4);
        }
      }
      return -1;
    });
    expect(coloredRatio).toBeGreaterThan(0.1);
  });

  test('custom series renders without unregistered-series warning', async ({ page }) => {
    // v0.12.0 CustomChart 등록 — 미등록이면 dev 경고 후 무음 미렌더된다
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await page.goto('/demo/');
    await waitForWidgets(page);
    await page.waitForTimeout(1500);

    const hasCanvas = await page.evaluate(() => {
      const widget = document.getElementById('demo-chart-custom');
      if (!widget?.shadowRoot) return false;
      for (const child of widget.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot?.querySelector('canvas')) return true;
      }
      return false;
    });
    expect(hasCanvas).toBe(true);
    expect(warnings.filter((w) => w.includes('series type'))).toEqual([]);
  });

  for (const id of chartIds) {
    test(`${id} renders canvas`, async ({ page }) => {
      await page.waitForTimeout(500);
      const hasCanvas = await page.evaluate((hostId) => {
        const widget = document.getElementById(hostId);
        if (!widget?.shadowRoot) return false;
        for (const child of widget.shadowRoot.querySelectorAll('*')) {
          if (child.shadowRoot?.querySelector('canvas')) return true;
        }
        return false;
      }, id);
      expect(hasCanvas).toBe(true);
    });
  }
});

// ── 5. Input Widgets ──

test.describe('Input Widgets', () => {
  test('form renders input fields', async ({ page }) => {
    const hasInput = await deepShadowHas(page, 'demo-form', 'input');
    expect(hasInput).toBe(true);
  });

  test('confirm renders action buttons', async ({ page }) => {
    const text = await deepShadowText(page, 'demo-confirm');
    expect(text).toContain('Delete');
    expect(text).toContain('Cancel');
  });
});

// ── 6. Compose ──

test.describe('Compose', () => {
  test('compose renders child widgets', async ({ page }) => {
    const childCount = await page.evaluate(() => {
      const host = document.getElementById('demo-compose');
      if (!host?.shadowRoot) return 0;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const widgets = child.shadowRoot.querySelectorAll('u-widget');
          if (widgets.length > 0) return widgets.length;
        }
      }
      return 0;
    });
    expect(childCount).toBe(3);
  });
});

// ── 7. Dark Mode ──

test.describe('Theme', () => {
  test('dark mode toggle works', async ({ page }) => {
    const hasDarkBefore = await page.evaluate(
      () => document.body.classList.contains('dark'),
    );
    expect(hasDarkBefore).toBe(false);

    await page.click('#theme-btn');

    const hasDarkAfter = await page.evaluate(
      () => document.body.classList.contains('dark'),
    );
    expect(hasDarkAfter).toBe(true);

    const btnText = await page.textContent('#theme-btn');
    expect(btnText).toBe('Light Mode');
  });
});

// ── 8. Keyboard Navigation ──

test.describe('Keyboard Navigation', () => {
  test('table rows are keyboard-navigable', async ({ page }) => {
    // Focus the first table row inside nested shadow DOM
    await page.evaluate(() => {
      const host = document.getElementById('demo-table');
      if (!host?.shadowRoot) return;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const row = child.shadowRoot.querySelector('tbody tr') as HTMLElement;
          if (row) { row.focus(); return; }
        }
      }
    });

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    const focusedIdx = await page.evaluate(() => {
      const host = document.getElementById('demo-table');
      if (!host?.shadowRoot) return -1;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const rows = child.shadowRoot.querySelectorAll('tbody tr');
          for (let i = 0; i < rows.length; i++) {
            if (rows[i] === child.shadowRoot.activeElement) return i;
          }
        }
      }
      return -1;
    });
    expect(focusedIdx).toBe(1);
  });

  test('list items are keyboard-navigable', async ({ page }) => {
    await page.evaluate(() => {
      const host = document.getElementById('demo-list');
      if (!host?.shadowRoot) return;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const item = child.shadowRoot.querySelector('.list-item') as HTMLElement;
          if (item) { item.focus(); return; }
        }
      }
    });

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    const focusedIdx = await page.evaluate(() => {
      const host = document.getElementById('demo-list');
      if (!host?.shadowRoot) return -1;
      for (const child of host.shadowRoot.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const items = child.shadowRoot.querySelectorAll('.list-item');
          for (let i = 0; i < items.length; i++) {
            if (items[i] === child.shadowRoot.activeElement) return i;
          }
        }
      }
      return -1;
    });
    expect(focusedIdx).toBe(1);
  });
});

// ── 9. Playground ──

test.describe('Playground', () => {
  test('playground renders custom spec', async ({ page }) => {
    const textarea = page.locator('#spec-input');
    await textarea.fill(JSON.stringify({
      widget: 'metric',
      data: { value: 9999, label: 'Custom Test' },
    }));

    await page.click('#render-btn');
    await page.waitForTimeout(1000);

    const text = await deepShadowText(page, 'demo-custom');
    expect(text).toContain('9999');
    expect(text).toContain('Custom Test');
  });
});
