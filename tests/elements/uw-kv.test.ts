import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/uw-kv.js';
import type { UwKv } from '../../src/elements/uw-kv.js';

function createElement(spec: Record<string, unknown>): UwKv {
  const el = document.createElement('uw-kv') as UwKv;
  el.spec = spec as unknown as UwKv['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UwKv) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('uw-kv', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined as a custom element', () => {
    expect(customElements.get('uw-kv')).toBeDefined();
  });

  it('renders nothing when spec is null', async () => {
    const el = document.createElement('uw-kv') as UwKv;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="kv"]')).toBeNull();
  });

  it('renders nothing when data is empty object', async () => {
    const el = createElement({ widget: 'kv', data: {} });
    const shadow = await render(el);
    expect(shadow.querySelector('[part="kv"]')).toBeNull();
  });

  // ── Object Data ──

  describe('object data', () => {
    it('renders key-value pairs from a flat object', async () => {
      const el = createElement({
        widget: 'kv',
        data: { status: 'Active', plan: 'Pro' },
      });
      const shadow = await render(el);
      const pairs = shadow.querySelectorAll('[part="kv-pair"]');
      expect(pairs).toHaveLength(2);
    });

    it('renders correct keys and values', async () => {
      const el = createElement({
        widget: 'kv',
        data: { name: 'Alice', role: 'Engineer' },
      });
      const shadow = await render(el);
      const keys = shadow.querySelectorAll('.kv-key');
      const values = shadow.querySelectorAll('.kv-value');
      expect(keys[0].textContent).toBe('name');
      expect(values[0].textContent).toBe('Alice');
      expect(keys[1].textContent).toBe('role');
      expect(values[1].textContent).toBe('Engineer');
    });

    it('renders numeric values as strings', async () => {
      const el = createElement({
        widget: 'kv',
        data: { count: 42 },
      });
      const shadow = await render(el);
      const value = shadow.querySelector('.kv-value');
      expect(value?.textContent).toBe('42');
    });
  });

  // ── Array Data ──

  describe('array data', () => {
    it('renders label · value pairs from an array of {label, value}', async () => {
      const el = createElement({
        widget: 'kv',
        data: [
          { label: 'Name', value: 'Alice' },
          { label: 'Email', value: 'alice@example.com' },
        ],
      });
      const shadow = await render(el);
      const pairs = shadow.querySelectorAll('[part="kv-pair"]');
      expect(pairs).toHaveLength(2);
    });

    it('renders correct keys and values from array', async () => {
      const el = createElement({
        widget: 'kv',
        data: [
          { label: 'Status', value: 'Active' },
          { label: 'Plan', value: 'Enterprise' },
        ],
      });
      const shadow = await render(el);
      const keys = shadow.querySelectorAll('.kv-key');
      const values = shadow.querySelectorAll('.kv-value');
      expect(keys[0].textContent).toBe('Status');
      expect(values[0].textContent).toBe('Active');
      expect(keys[1].textContent).toBe('Plan');
      expect(values[1].textContent).toBe('Enterprise');
    });

    it('filters out invalid items in array', async () => {
      const el = createElement({
        widget: 'kv',
        data: [
          { label: 'Valid', value: 'Yes' },
          { nokey: 'Bad' },
          null,
          { label: 'Also Valid', value: 'Yes' },
        ],
      });
      const shadow = await render(el);
      const pairs = shadow.querySelectorAll('[part="kv-pair"]');
      expect(pairs).toHaveLength(2);
    });

    it('renders nothing for empty array', async () => {
      const el = createElement({ widget: 'kv', data: [] });
      const shadow = await render(el);
      expect(shadow.querySelector('[part="kv"]')).toBeNull();
    });
  });

  // ── Layouts ──

  describe('layouts', () => {
    it('defaults to vertical layout', async () => {
      const el = createElement({
        widget: 'kv',
        data: { a: '1', b: '2' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.kv-vertical')).not.toBeNull();
    });

    it('renders horizontal layout', async () => {
      const el = createElement({
        widget: 'kv',
        data: { a: '1', b: '2' },
        options: { layout: 'horizontal' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.kv-horizontal')).not.toBeNull();
    });

    it('renders grid layout', async () => {
      const el = createElement({
        widget: 'kv',
        data: { a: '1', b: '2', c: '3', d: '4' },
        options: { layout: 'grid' },
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.kv-grid');
      expect(grid).not.toBeNull();
    });

    it('applies custom column count for grid layout', async () => {
      const el = createElement({
        widget: 'kv',
        data: { a: '1', b: '2', c: '3' },
        options: { layout: 'grid', columns: 3 },
      });
      const shadow = await render(el);
      const grid = shadow.querySelector('.kv-grid') as HTMLElement;
      expect(grid).not.toBeNull();
      expect(grid.style.gridTemplateColumns).toContain('repeat(3');
    });
  });

  // ── Accessibility ──

  describe('accessibility', () => {
    it('has list role on container', async () => {
      const el = createElement({
        widget: 'kv',
        data: { a: '1' },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('[part="kv"]');
      expect(container?.getAttribute('role')).toBe('list');
    });

    it('has listitem role on each pair', async () => {
      const el = createElement({
        widget: 'kv',
        data: { a: '1', b: '2' },
      });
      const shadow = await render(el);
      const items = shadow.querySelectorAll('[role="listitem"]');
      expect(items).toHaveLength(2);
    });

    it('uses title for aria-label when provided', async () => {
      const el = createElement({
        widget: 'kv',
        title: 'Account Info',
        data: { status: 'Active' },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('[part="kv"]');
      expect(container?.getAttribute('aria-label')).toBe('Account Info');
    });

    it('uses default aria-label when no title', async () => {
      const el = createElement({
        widget: 'kv',
        data: { status: 'Active' },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('[part="kv"]');
      expect(container?.getAttribute('aria-label')).toBe('Key-value pairs');
    });
  });

  // ── CSS Parts ──

  it('exposes kv, kv-pair, kv-key, kv-value parts', async () => {
    const el = createElement({
      widget: 'kv',
      data: { a: '1' },
    });
    const shadow = await render(el);
    expect(shadow.querySelector('[part="kv"]')).not.toBeNull();
    expect(shadow.querySelector('[part="kv-pair"]')).not.toBeNull();
    expect(shadow.querySelector('[part="kv-key"]')).not.toBeNull();
    expect(shadow.querySelector('[part="kv-value"]')).not.toBeNull();
  });
});

describe('uw-kv as a stat list', () => {
  it('formats each value with its unit, marks and colours it by its tone, and puts its note under it', async () => {
    const el = document.createElement('uw-kv') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    el.spec = { widget: 'kv', data: [
      { label: 'Flow', value: 412.46, format: 'number:1', unit: 'm³/h' },
      { label: 'Pressure', value: 7.9, unit: 'bar', tone: 'warn', note: 'limit 8' },
    ], options: { locale: 'en-US' } };
    document.body.appendChild(el);
    await el.updateComplete;
    const pairs = [...el.shadowRoot!.querySelectorAll('.kv-pair')];
    expect(pairs.map(p => p.querySelector('.kv-value')?.textContent)).toEqual(['412.5 m³/h', '▲7.9 bar']);
    expect(pairs[1].getAttribute('data-tone')).toBe('warn');
    expect(pairs[1].querySelector('[part="kv-note"]')?.textContent).toBe('limit 8');
    el.remove();
  });

  it('no longer reads an array item’s `key` (it is `label`)', async () => {
    const el = document.createElement('uw-kv') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    el.spec = { widget: 'kv', data: [{ key: 'Old', value: 1 }] };
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.kv-pair')).toBeNull();
    el.remove();
  });
});
