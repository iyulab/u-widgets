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
 * Read text from the deepest shadow root of a u-widget.
 * Traverses: u-widget#shadow → inner-element#shadow → textContent
 */
async function deepShadowText(page: Page, id: string): Promise<string> {
  return page.evaluate((hostId) => {
    const host = document.getElementById(hostId);
    if (!host?.shadowRoot) return '';
    // Find the inner component (u-metric, u-table, u-gauge, etc.)
    const inner = host.shadowRoot.querySelector('[class]') ??
                  host.shadowRoot.children[0];
    if (inner?.shadowRoot) {
      return inner.shadowRoot.textContent?.trim() ?? '';
    }
    return host.shadowRoot.textContent?.trim() ?? '';
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
  ];

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
