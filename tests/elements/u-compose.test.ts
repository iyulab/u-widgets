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
});
