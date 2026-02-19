import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/u-kv.js';
import type { UKv } from '../../src/elements/u-kv.js';

function createElement(spec: Record<string, unknown>): UKv {
  const el = document.createElement('u-kv') as UKv;
  el.spec = spec as UKv['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UKv) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-kv', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined as a custom element', () => {
    expect(customElements.get('u-kv')).toBeDefined();
  });

  it('renders nothing when spec is null', async () => {
    const el = document.createElement('u-kv') as UKv;
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
    it('renders key-value pairs from array of {key, value}', async () => {
      const el = createElement({
        widget: 'kv',
        data: [
          { key: 'Name', value: 'Alice' },
          { key: 'Email', value: 'alice@example.com' },
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
          { key: 'Status', value: 'Active' },
          { key: 'Plan', value: 'Enterprise' },
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
          { key: 'Valid', value: 'Yes' },
          { nokey: 'Bad' },
          null,
          { key: 'Also Valid', value: 'Yes' },
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
