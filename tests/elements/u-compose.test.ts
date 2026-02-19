import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/u-compose.js';
import type { UCompose } from '../../src/elements/u-compose.js';

function createElement(spec: Record<string, unknown>): UCompose {
  const el = document.createElement('u-compose') as UCompose;
  el.spec = spec as UCompose['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UCompose) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-compose', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders stack layout by default', async () => {
    const el = createElement({
      widget: 'compose',
      children: [
        { widget: 'metric', data: { value: 42 } },
        { widget: 'metric', data: { value: 100 } },
      ],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.layout-stack')).not.toBeNull();
  });

  it('renders row layout', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'row',
      children: [
        { widget: 'metric', data: { value: 1 } },
        { widget: 'metric', data: { value: 2 } },
      ],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.layout-row')).not.toBeNull();
  });

  it('renders grid layout with columns', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'grid',
      columns: 3,
      children: [
        { widget: 'metric', data: { value: 1 } },
        { widget: 'metric', data: { value: 2 } },
        { widget: 'metric', data: { value: 3 } },
      ],
    });
    const shadow = await render(el);
    const grid = shadow.querySelector('.layout-grid') as HTMLElement;
    expect(grid).not.toBeNull();
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('defaults grid columns to 2', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'grid',
      children: [
        { widget: 'metric', data: { value: 1 } },
        { widget: 'metric', data: { value: 2 } },
      ],
    });
    const shadow = await render(el);
    const grid = shadow.querySelector('.layout-grid') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('renders title when provided', async () => {
    const el = createElement({
      widget: 'compose',
      title: 'Dashboard',
      children: [{ widget: 'metric', data: { value: 42 } }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.compose-title')?.textContent).toBe('Dashboard');
  });

  it('does not render title when absent', async () => {
    const el = createElement({
      widget: 'compose',
      children: [{ widget: 'metric', data: { value: 42 } }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.compose-title')).toBeNull();
  });

  it('renders correct number of children', async () => {
    const el = createElement({
      widget: 'compose',
      children: [
        { widget: 'metric', data: { value: 1 } },
        { widget: 'metric', data: { value: 2 } },
        { widget: 'metric', data: { value: 3 } },
      ],
    });
    const shadow = await render(el);
    const children = shadow.querySelectorAll('.child');
    expect(children.length).toBe(3);
  });

  it('renders u-widget for each child', async () => {
    const el = createElement({
      widget: 'compose',
      children: [
        { widget: 'metric', data: { value: 42 } },
      ],
    });
    const shadow = await render(el);
    const uWidgets = shadow.querySelectorAll('u-widget');
    expect(uWidgets.length).toBe(1);
  });

  it('applies span to grid children', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'grid',
      columns: 3,
      children: [
        { widget: 'metric', data: { value: 1 }, span: 2 },
        { widget: 'metric', data: { value: 2 } },
      ],
    });
    const shadow = await render(el);
    const children = shadow.querySelectorAll('.child') as NodeListOf<HTMLElement>;
    expect(children[0].style.gridColumn).toBe('span 2');
  });

  it('clamps invalid span to 1 (no grid-column applied)', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'grid',
      columns: 3,
      children: [
        { widget: 'metric', data: { value: 1 }, span: -5 },
        { widget: 'metric', data: { value: 2 }, span: 'abc' },
        { widget: 'metric', data: { value: 3 }, span: 0 },
      ],
    });
    const shadow = await render(el);
    const children = shadow.querySelectorAll('.child') as NodeListOf<HTMLElement>;
    // All invalid spans should be treated as default (no grid-column)
    expect(children[0].style.gridColumn).toBe('');
    expect(children[1].style.gridColumn).toBe('');
    expect(children[2].style.gridColumn).toBe('');
  });

  it('floors fractional span values', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'grid',
      columns: 3,
      children: [
        { widget: 'metric', data: { value: 1 }, span: 2.7 },
      ],
    });
    const shadow = await render(el);
    const children = shadow.querySelectorAll('.child') as NodeListOf<HTMLElement>;
    expect(children[0].style.gridColumn).toBe('span 2');
  });

  it('renders nothing when spec is null', async () => {
    const el = document.createElement('u-compose') as UCompose;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.children.length).toBe(0);
  });

  it('renders empty layout when no children', async () => {
    const el = createElement({
      widget: 'compose',
      children: [],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.layout-stack')).not.toBeNull();
    expect(shadow.querySelectorAll('.child').length).toBe(0);
  });

  it('supports mixed widget types as children', async () => {
    const el = createElement({
      widget: 'compose',
      layout: 'row',
      children: [
        { widget: 'metric', data: { value: 42, unit: 'ms' } },
        { widget: 'gauge', data: { value: 75 } },
      ],
    });
    const shadow = await render(el);
    const uWidgets = shadow.querySelectorAll('u-widget');
    expect(uWidgets.length).toBe(2);
  });

  it('has container-type declared in styles', () => {
    const styles = (customElements.get('u-compose') as any).styles;
    const cssText = Array.isArray(styles)
      ? styles.map((s: any) => s.cssText ?? '').join(' ')
      : styles?.cssText ?? '';
    expect(cssText).toContain('container');
    expect(cssText).toContain('u-compose');
  });

  describe('column widths', () => {
    it('applies proportional widths from options.widths', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 3,
        options: { widths: [1, 2, 1] },
        children: [
          { widget: 'metric', data: { value: 1 } },
          { widget: 'metric', data: { value: 2 } },
          { widget: 'metric', data: { value: 3 } },
        ],
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.layout-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toBe('1fr 2fr 1fr');
    });

    it('supports "auto" and "stretch" width values', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 3,
        options: { widths: ['auto', 2, 'stretch'] },
        children: [
          { widget: 'metric', data: { value: 1 } },
          { widget: 'metric', data: { value: 2 } },
          { widget: 'metric', data: { value: 3 } },
        ],
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.layout-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toBe('auto 2fr 1fr');
    });

    it('falls back to equal columns when widths is empty', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        options: { widths: [] },
        children: [
          { widget: 'metric', data: { value: 1 } },
          { widget: 'metric', data: { value: 2 } },
        ],
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.layout-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    });

    it('falls back to 1fr for invalid width values', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        options: { widths: ['invalid', -5] },
        children: [
          { widget: 'metric', data: { value: 1 } },
          { widget: 'metric', data: { value: 2 } },
        ],
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.layout-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toBe('1fr 1fr');
    });

    it('falls back to repeat when widths is not an array', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        options: { widths: 'invalid' },
        children: [
          { widget: 'metric', data: { value: 1 } },
          { widget: 'metric', data: { value: 2 } },
        ],
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.layout-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    });
  });

  describe('card option', () => {
    it('applies child-card class when options.card is true', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        options: { card: true },
        children: [
          { widget: 'metric', data: { value: 42 } },
          { widget: 'metric', data: { value: 100 } },
        ],
      });
      const shadow = await render(el);
      const children = shadow.querySelectorAll('.child-card');
      expect(children.length).toBe(2);
    });

    it('does not apply child-card class by default', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.child-card')).toBeNull();
    });
  });

  describe('collapsed sections', () => {
    it('renders collapsed child as details element', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 }, title: 'More', collapsed: true },
        ],
      });
      const shadow = await render(el);
      const details = shadow.querySelector('details.child-collapsed');
      expect(details).not.toBeNull();
    });

    it('uses child title as summary text', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 }, title: 'Show metrics', collapsed: true },
        ],
      });
      const shadow = await render(el);
      const summary = shadow.querySelector('summary');
      expect(summary?.textContent?.trim()).toBe('Show metrics');
    });

    it('defaults summary to "Details" when no title', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 }, collapsed: true },
        ],
      });
      const shadow = await render(el);
      const summary = shadow.querySelector('summary');
      expect(summary?.textContent?.trim()).toBe('Details');
    });

    it('renders widget inside collapsed content', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 }, title: 'More', collapsed: true },
        ],
      });
      const shadow = await render(el);
      const content = shadow.querySelector('.collapsed-content');
      expect(content?.querySelector('u-widget')).not.toBeNull();
    });

    it('non-collapsed children render as regular divs', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('details')).toBeNull();
      expect(shadow.querySelector('.child')).not.toBeNull();
    });

    it('collapsed child in grid applies span', async () => {
      const el = createElement({
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        children: [
          { widget: 'metric', data: { value: 1 } },
          { widget: 'metric', data: { value: 2 }, title: 'More', collapsed: true, span: 2 },
        ],
      });
      const shadow = await render(el);
      const details = shadow.querySelector('details.child-collapsed') as HTMLElement;
      expect(details.style.gridColumn).toBe('span 2');
    });

    it('exposes collapsed-summary part', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 }, title: 'More', collapsed: true },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('[part="collapsed-summary"]')).not.toBeNull();
    });
  });

  describe('theme propagation', () => {
    it('propagates theme="dark" to child u-widget elements', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
          { widget: 'metric', data: { value: 100 } },
        ],
      });
      el.theme = 'dark';
      const shadow = await render(el);
      const widgets = shadow.querySelectorAll('u-widget');
      expect(widgets.length).toBe(2);
      for (const w of widgets) {
        expect(w.getAttribute('theme')).toBe('dark');
      }
    });

    it('propagates theme="light" to child u-widget elements', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      el.theme = 'light';
      const shadow = await render(el);
      const widget = shadow.querySelector('u-widget');
      expect(widget?.getAttribute('theme')).toBe('light');
    });

    it('does not set theme on children when theme is null', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      const shadow = await render(el);
      const widget = shadow.querySelector('u-widget');
      expect(widget?.hasAttribute('theme')).toBe(false);
    });

    it('propagates theme to collapsed children', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 }, title: 'More', collapsed: true },
        ],
      });
      el.theme = 'dark';
      const shadow = await render(el);
      const widget = shadow.querySelector('.collapsed-content u-widget');
      expect(widget?.getAttribute('theme')).toBe('dark');
    });

    it('updates children when theme changes', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      el.theme = 'dark';
      await el.updateComplete;
      let widget = el.shadowRoot!.querySelector('u-widget');
      expect(widget?.getAttribute('theme')).toBe('dark');

      el.theme = 'light';
      await el.updateComplete;
      widget = el.shadowRoot!.querySelector('u-widget');
      expect(widget?.getAttribute('theme')).toBe('light');
    });
  });

  describe('ARIA', () => {
    it('has role="region" and aria-label when title is set', async () => {
      const el = createElement({
        widget: 'compose',
        title: 'Dashboard',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.compose-container');
      expect(container?.getAttribute('role')).toBe('region');
      expect(container?.getAttribute('aria-label')).toBe('Dashboard');
    });

    it('has no role when title is absent', async () => {
      const el = createElement({
        widget: 'compose',
        children: [
          { widget: 'metric', data: { value: 42 } },
        ],
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.compose-container');
      expect(container?.hasAttribute('role')).toBe(false);
    });
  });
});
