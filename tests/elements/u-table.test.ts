import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/u-table.js';
import type { UTable } from '../../src/elements/u-table.js';

function createElement(spec: Record<string, unknown>): UTable {
  const el = document.createElement('u-table') as UTable;
  el.spec = spec as UTable['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UTable) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-table', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('table widget', () => {
    it('renders table element', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', role: 'Engineer' },
          { name: 'Bob', role: 'Designer' },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('table')).not.toBeNull();
    });

    it('auto-infers columns from data keys', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', role: 'Engineer', status: 'Active' },
        ],
      });
      const shadow = await render(el);
      const ths = shadow.querySelectorAll('th');
      expect(ths.length).toBe(3);
      expect(ths[0].textContent).toBe('name');
      expect(ths[1].textContent).toBe('role');
      expect(ths[2].textContent).toBe('status');
    });

    it('uses explicit column labels', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ id: '001', name: 'Alice' }],
        mapping: {
          columns: [
            { field: 'id', label: 'ID' },
            { field: 'name', label: 'Name' },
          ],
        },
      });
      const shadow = await render(el);
      const ths = shadow.querySelectorAll('th');
      expect(ths[0].textContent).toBe('ID');
      expect(ths[1].textContent).toBe('Name');
    });

    it('renders correct cell values', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', value: 100 },
          { name: 'Bob', value: 200 },
        ],
      });
      const shadow = await render(el);
      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
      const cells = rows[0].querySelectorAll('td');
      expect(cells[0].textContent).toBe('Alice');
      expect(cells[1].textContent).toBe('100');
    });

    it('applies format hints to cells', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ amount: 50000 }],
        mapping: {
          columns: [{ field: 'amount', label: 'Amount', format: 'number' }],
        },
      });
      const shadow = await render(el);
      const cell = shadow.querySelector('tbody td');
      expect(cell?.textContent).toBe('50,000');
    });

    it('applies alignment to columns', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ amount: 100 }],
        mapping: {
          columns: [{ field: 'amount', label: 'Amount', align: 'right' }],
        },
      });
      const shadow = await render(el);
      const th = shadow.querySelector('th');
      expect(th?.getAttribute('data-align')).toBe('right');
    });

    it('renders nothing when no data', async () => {
      const el = createElement({ widget: 'table' });
      const shadow = await render(el);
      expect(shadow.querySelector('table')).toBeNull();
    });

    it('has aria-label and scope="col" on headers', async () => {
      const el = createElement({
        widget: 'table',
        title: 'User List',
        data: [{ name: 'Alice', role: 'Engineer' }],
      });
      const shadow = await render(el);
      const table = shadow.querySelector('table');
      expect(table?.getAttribute('aria-label')).toBe('User List');
      const ths = shadow.querySelectorAll('th');
      for (const th of ths) {
        expect(th.getAttribute('scope')).toBe('col');
      }
    });
  });

  describe('row select event', () => {
    it('dispatches select event on table row click', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', role: 'Engineer' },
          { name: 'Bob', role: 'Designer' },
        ],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const firstRow = shadow.querySelector('tbody tr') as HTMLElement;
      firstRow.click();

      expect(listener).toHaveBeenCalledOnce();
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.type).toBe('select');
      expect(detail.widget).toBe('table');
      expect(detail.data.name).toBe('Alice');
      expect(detail.data._index).toBe(0);
    });

    it('dispatches select event on list item click', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { text: 'Task A', status: 'done' },
          { text: 'Task B', status: 'pending' },
        ],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const items = shadow.querySelectorAll('.list-item');
      (items[1] as HTMLElement).click();

      expect(listener).toHaveBeenCalledOnce();
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.type).toBe('select');
      expect(detail.widget).toBe('list');
      expect(detail.data.text).toBe('Task B');
      expect(detail.data._index).toBe(1);
    });
  });

  describe('sorting', () => {
    it('sorts ascending on first header click', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Charlie', value: 30 },
          { name: 'Alice', value: 10 },
          { name: 'Bob', value: 20 },
        ],
      });
      const shadow = await render(el);

      // Click 'name' column header
      const ths = shadow.querySelectorAll('th');
      (ths[0] as HTMLElement).click();
      await el.updateComplete;

      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Alice');
      expect(rows[1].querySelectorAll('td')[0].textContent).toBe('Bob');
      expect(rows[2].querySelectorAll('td')[0].textContent).toBe('Charlie');
    });

    it('sorts descending on second header click', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', value: 10 },
          { name: 'Bob', value: 20 },
          { name: 'Charlie', value: 30 },
        ],
      });
      const shadow = await render(el);

      const th = shadow.querySelectorAll('th')[1] as HTMLElement; // value column
      th.click(); // asc
      await el.updateComplete;
      th.click(); // desc
      await el.updateComplete;

      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].querySelectorAll('td')[1].textContent).toBe('30');
      expect(rows[2].querySelectorAll('td')[1].textContent).toBe('10');
    });

    it('resets sort on third click', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Charlie' },
          { name: 'Alice' },
          { name: 'Bob' },
        ],
      });
      const shadow = await render(el);

      const th = shadow.querySelectorAll('th')[0] as HTMLElement;
      th.click(); // asc
      await el.updateComplete;
      th.click(); // desc
      await el.updateComplete;
      th.click(); // reset
      await el.updateComplete;

      const rows = shadow.querySelectorAll('tbody tr');
      // Back to original order
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Charlie');
    });

    it('shows sort arrow indicator', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }, { name: 'Bob' }],
      });
      const shadow = await render(el);

      const th = shadow.querySelectorAll('th')[0] as HTMLElement;
      th.click();
      await el.updateComplete;

      expect(shadow.querySelector('.sort-arrow')?.textContent).toBe('\u25B2');
    });

    it('disables sorting when options.sortable is false', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Charlie' },
          { name: 'Alice' },
        ],
        options: { sortable: false },
      });
      const shadow = await render(el);

      const th = shadow.querySelectorAll('th')[0] as HTMLElement;
      expect(th.hasAttribute('data-sortable')).toBe(false);
      th.click();
      await el.updateComplete;

      // Order unchanged
      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Charlie');
    });

    it('has aria-sort attribute', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
      });
      const shadow = await render(el);

      const th = shadow.querySelectorAll('th')[0] as HTMLElement;
      expect(th.getAttribute('aria-sort')).toBe('none');

      th.click();
      await el.updateComplete;
      expect(th.getAttribute('aria-sort')).toBe('ascending');
    });
  });

  describe('list widget', () => {
    it('renders list container', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'Item 1' }, { text: 'Item 2' }],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.list-container')).not.toBeNull();
    });

    it('renders primary text', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { text: 'Task A', status: 'done' },
          { text: 'Task B', status: 'pending' },
        ],
        mapping: { primary: 'text', secondary: 'status' },
      });
      const shadow = await render(el);
      const items = shadow.querySelectorAll('.list-item');
      expect(items.length).toBe(2);
      expect(items[0].querySelector('.list-primary')?.textContent).toBe('Task A');
      expect(items[0].querySelector('.list-secondary')?.textContent).toBe('done');
    });

    it('renders icon from field value', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'Design review', status: 'done' }],
        mapping: { primary: 'text', icon: 'status' },
      });
      const shadow = await render(el);
      const icon = shadow.querySelector('.list-icon');
      expect(icon?.textContent).toBe('D');
    });

    it('renders avatar image when mapping.avatar is set', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { name: 'Alice', pic: 'https://example.com/alice.jpg' },
        ],
        mapping: { primary: 'name', avatar: 'pic' },
      });
      const shadow = await render(el);
      const img = shadow.querySelector('.list-avatar') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('alice.jpg');
    });

    it('renders trailing value when mapping.trailing is set', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { name: 'Task A', score: 95 },
          { name: 'Task B', score: 82 },
        ],
        mapping: { primary: 'name', trailing: 'score' },
      });
      const shadow = await render(el);
      const trailing = shadow.querySelectorAll('.list-trailing');
      expect(trailing.length).toBe(2);
      expect(trailing[0].textContent).toBe('95');
      expect(trailing[1].textContent).toBe('82');
    });

    it('prefers avatar over icon when both are set', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { name: 'Alice', pic: 'https://example.com/a.jpg', status: 'active' },
        ],
        mapping: { primary: 'name', avatar: 'pic', icon: 'status' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.list-avatar')).not.toBeNull();
      expect(shadow.querySelector('.list-icon')).toBeNull();
    });

    it('infers primary key when no mapping', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ title: 'First item' }],
      });
      const shadow = await render(el);
      const primary = shadow.querySelector('.list-primary');
      expect(primary?.textContent).toBe('First item');
    });
  });
});
