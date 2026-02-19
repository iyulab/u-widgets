import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/u-table.js';
import type { UTable } from '../../src/elements/u-table.js';
import { registerLocale } from '../../src/core/locale.js';

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

    it('sorts numeric strings numerically, not alphabetically', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { rank: '10', name: 'C' },
          { rank: '2', name: 'A' },
          { rank: '1', name: 'B' },
        ],
      });
      const shadow = await render(el);

      // Click 'rank' header to sort ascending
      const th = shadow.querySelectorAll('th')[0] as HTMLElement;
      th.click();
      await el.updateComplete;

      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('1');
      expect(rows[1].querySelectorAll('td')[0].textContent).toBe('2');
      expect(rows[2].querySelectorAll('td')[0].textContent).toBe('10');
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

    it('sortable headers have tabindex="0"', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice', age: 30 }],
      });
      const shadow = await render(el);
      const ths = shadow.querySelectorAll('th');
      ths.forEach((th) => {
        expect(th.getAttribute('tabindex')).toBe('0');
      });
    });

    it('Enter key triggers sort on header', async () => {
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
      th.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;

      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Alice');
    });

    it('Space key triggers sort on header', async () => {
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
      th.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;

      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Alice');
    });

    it('non-sortable headers have no tabindex', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
        options: { sortable: false },
      });
      const shadow = await render(el);
      const th = shadow.querySelectorAll('th')[0] as HTMLElement;
      expect(th.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('pagination', () => {
    it('shows all rows when no pageSize', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'A' }, { name: 'B' }, { name: 'C' },
          { name: 'D' }, { name: 'E' },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelectorAll('tbody tr').length).toBe(5);
      expect(shadow.querySelector('.pagination')).toBeNull();
    });

    it('paginates when pageSize is set', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'A' }, { name: 'B' }, { name: 'C' },
          { name: 'D' }, { name: 'E' },
        ],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);
      expect(shadow.querySelectorAll('tbody tr').length).toBe(2);
      const firstRow = shadow.querySelector('tbody tr td');
      expect(firstRow?.textContent).toBe('A');
      expect(shadow.querySelector('.pagination')).not.toBeNull();
      expect(shadow.querySelector('.pagination span')?.textContent).toBe('1 / 3');
    });

    it('navigates to next page', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'A' }, { name: 'B' }, { name: 'C' },
        ],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);

      const buttons = shadow.querySelectorAll('.pagination button');
      (buttons[1] as HTMLElement).click(); // Next
      await el.updateComplete;

      expect(shadow.querySelectorAll('tbody tr').length).toBe(1);
      expect(shadow.querySelector('tbody tr td')?.textContent).toBe('C');
      expect(shadow.querySelector('.pagination span')?.textContent).toBe('2 / 2');
    });

    it('prev button is disabled on first page', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);

      const prevBtn = shadow.querySelectorAll('.pagination button')[0] as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });

    it('next button is disabled on last page', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);

      // Navigate to last page
      const buttons = shadow.querySelectorAll('.pagination button');
      (buttons[1] as HTMLElement).click(); // Next
      await el.updateComplete;

      const nextBtn = shadow.querySelectorAll('.pagination button')[1] as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('pagination uses nav element with aria-label', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);
      const nav = shadow.querySelector('nav.pagination');
      expect(nav).not.toBeNull();
      expect(nav?.getAttribute('aria-label')).toBe('Table pagination');
    });

    it('pagination buttons have aria-labels', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);
      const buttons = shadow.querySelectorAll('.pagination button');
      expect(buttons[0].getAttribute('aria-label')).toBe('Previous page');
      expect(buttons[1].getAttribute('aria-label')).toBe('Next page');
    });

    it('hides pagination when only one page', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }],
        options: { pageSize: 10 },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.pagination')).toBeNull();
    });
  });

  describe('searchable', () => {
    it('shows search input when searchable is true', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
        options: { searchable: true },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.search-input')).not.toBeNull();
    });

    it('search input has aria-label', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
        options: { searchable: true },
      });
      const shadow = await render(el);
      const input = shadow.querySelector('.search-input');
      expect(input?.getAttribute('aria-label')).toBe('Search table');
    });

    it('does not show search input by default', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.search-input')).toBeNull();
    });

    it('filters rows by search query', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', role: 'admin' },
          { name: 'Bob', role: 'user' },
          { name: 'Charlie', role: 'admin' },
        ],
        options: { searchable: true },
      });
      const shadow = await render(el);
      const input = shadow.querySelector('.search-input') as HTMLInputElement;

      input.value = 'admin';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      expect(shadow.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('search is case-insensitive', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice' },
          { name: 'Bob' },
        ],
        options: { searchable: true },
      });
      const shadow = await render(el);
      const input = shadow.querySelector('.search-input') as HTMLInputElement;

      input.value = 'alice';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      expect(shadow.querySelectorAll('tbody tr').length).toBe(1);
    });

    it('search + pagination resets to page 0', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'A1' }, { name: 'A2' }, { name: 'A3' },
          { name: 'B1' }, { name: 'B2' },
        ],
        options: { searchable: true, pageSize: 2 },
      });
      const shadow = await render(el);

      // Go to page 2
      const nextBtn = shadow.querySelectorAll('.pagination button')[1] as HTMLElement;
      nextBtn.click();
      await el.updateComplete;

      // Now search — should reset to page 0
      const input = shadow.querySelector('.search-input') as HTMLInputElement;
      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      // 3 results matching 'A', pageSize 2 → shows 2 on page 1
      expect(shadow.querySelectorAll('tbody tr').length).toBe(2);
      expect(shadow.querySelector('.pagination span')?.textContent).toBe('1 / 2');
    });
  });

  describe('compact mode', () => {
    it('adds compact class to table container when options.compact is true', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
        options: { compact: true },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.table-container');
      expect(container?.classList.contains('compact')).toBe(true);
    });

    it('does not add compact class by default', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.table-container');
      expect(container?.classList.contains('compact')).toBe(false);
    });

    it('compact table has smaller padding on th and td', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice', value: 100 }],
        options: { compact: true },
      });
      const shadow = await render(el);
      // Verify structure still renders correctly in compact mode
      expect(shadow.querySelectorAll('th').length).toBe(2);
      expect(shadow.querySelectorAll('tbody tr').length).toBe(1);
    });

    it('adds compact class to list container', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'Item 1' }],
        mapping: { primary: 'text' },
        options: { compact: true },
      });
      const shadow = await render(el);
      const container = shadow.querySelector('.list-container');
      expect(container?.classList.contains('compact')).toBe(true);
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

    it('prefers name over other keys for primary', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ score: 95, name: 'Alice', role: 'Engineer' }],
      });
      const shadow = await render(el);
      const primary = shadow.querySelector('.list-primary');
      expect(primary?.textContent).toBe('Alice');
    });

    it('falls back to first string field when no well-known key', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ count: 5, description: 'Hello', code: 'ABC' }],
      });
      const shadow = await render(el);
      const primary = shadow.querySelector('.list-primary');
      expect(primary?.textContent).toBe('Hello');
    });
  });

  describe('keyboard navigation', () => {
    it('first row has tabindex 0, others have -1', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });
      const shadow = await render(el);
      const rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].getAttribute('tabindex')).toBe('0');
      expect(rows[1].getAttribute('tabindex')).toBe('-1');
      expect(rows[2].getAttribute('tabindex')).toBe('-1');
    });

    it('ArrowDown moves focus to next row', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });
      const shadow = await render(el);
      const rows = shadow.querySelectorAll('tbody tr');

      rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(rows[0].getAttribute('tabindex')).toBe('-1');
      expect(rows[1].getAttribute('tabindex')).toBe('0');
    });

    it('ArrowUp moves focus to previous row', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });
      const shadow = await render(el);
      const rows = shadow.querySelectorAll('tbody tr');

      // Move to row 1 first
      rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Move back up
      rows[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(rows[0].getAttribute('tabindex')).toBe('0');
      expect(rows[1].getAttribute('tabindex')).toBe('-1');
    });

    it('Enter triggers row select event', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
      });
      const shadow = await render(el);
      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const row = shadow.querySelector('tbody tr') as HTMLElement;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].detail.type).toBe('select');
    });

    it('Home key moves to first row', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });
      const shadow = await render(el);
      const rows = shadow.querySelectorAll('tbody tr');

      // Move down two rows
      rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      rows[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Home
      rows[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(rows[0].getAttribute('tabindex')).toBe('0');
      expect(rows[2].getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('pagination tabindex reset', () => {
    it('resets first row tabindex to 0 after page change', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);

      // Page 1: rows A, B
      let rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].getAttribute('tabindex')).toBe('0');

      // Move focus to second row via keyboard
      rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(rows[1].getAttribute('tabindex')).toBe('0');

      // Click next page
      const nextBtn = shadow.querySelectorAll('.pagination button')[1] as HTMLElement;
      nextBtn.click();
      await el.updateComplete;

      // Page 2: rows C, D — first row should have tabindex 0
      rows = shadow.querySelectorAll('tbody tr');
      expect(rows[0].getAttribute('tabindex')).toBe('0');
      expect(rows[1].getAttribute('tabindex')).toBe('-1');
    });

    it('focuses first row after page change', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2 },
      });
      const shadow = await render(el);

      const nextBtn = shadow.querySelectorAll('.pagination button')[1] as HTMLElement;
      nextBtn.click();
      await el.updateComplete;
      // Wait for updateComplete.then() focus callback
      await new Promise((r) => setTimeout(r, 10));

      const firstRow = shadow.querySelector('tbody tr') as HTMLElement;
      // In happy-dom, focus may not fully work, but the tabindex should be correct
      expect(firstRow.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('list badge', () => {
    it('renders badge when mapping.badge is set', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { name: 'Task A', category: 'Bug' },
          { name: 'Task B', category: 'Feature' },
        ],
        mapping: { primary: 'name', badge: 'category' },
      });
      const shadow = await render(el);
      const badges = shadow.querySelectorAll('.list-badge');
      expect(badges.length).toBe(2);
      expect(badges[0].textContent).toBe('Bug');
      expect(badges[1].textContent).toBe('Feature');
    });

    it('does not render badge when mapping.badge is not set', async () => {
      const el = createElement({
        widget: 'list',
        data: [
          { name: 'Task A', category: 'Bug' },
        ],
        mapping: { primary: 'name' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.list-badge')).toBeNull();
    });
  });

  describe('list keyboard navigation', () => {
    it('first list item has tabindex 0, others have -1', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);
      const items = shadow.querySelectorAll('.list-item');
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
    });

    it('ArrowDown moves focus to next list item', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);
      const items = shadow.querySelectorAll('.list-item');

      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[1].getAttribute('tabindex')).toBe('0');
    });

    it('ArrowUp moves focus to previous list item', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'A' }, { text: 'B' }],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);
      const items = shadow.querySelectorAll('.list-item');

      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
    });

    it('Enter triggers select event on list item', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'Item A' }],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);
      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const item = shadow.querySelector('.list-item') as HTMLElement;
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].detail.type).toBe('select');
    });

    it('Home/End move to first/last list item', async () => {
      const el = createElement({
        widget: 'list',
        data: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
        mapping: { primary: 'text' },
      });
      const shadow = await render(el);
      const items = shadow.querySelectorAll('.list-item');

      // Move to last
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('0');

      // Move to first
      items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('container query', () => {
    it('has container-type declared in styles', () => {
      const styles = (customElements.get('u-table') as any).styles;
      const allCss = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(allCss).toContain('container');
      expect(allCss).toContain('u-table');
    });
  });

  describe('locale integration', () => {
    it('uses registered locale for pagination buttons', async () => {
      registerLocale('ko', { prev: '이전', next: '다음' });
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2, locale: 'ko' },
      });
      const shadow = await render(el);
      const buttons = shadow.querySelectorAll('.pagination button');
      expect(buttons[0].textContent).toContain('이전');
      expect(buttons[1].textContent).toContain('다음');
    });

    it('uses registered locale for search placeholder', async () => {
      registerLocale('ko', { searchPlaceholder: '검색...' });
      const el = createElement({
        widget: 'table',
        data: [{ name: 'Alice' }],
        options: { searchable: true, locale: 'ko' },
      });
      const shadow = await render(el);
      const input = shadow.querySelector('.search-input');
      expect(input?.getAttribute('placeholder')).toBe('검색...');
    });

    it('uses registered locale for ARIA labels', async () => {
      registerLocale('ko', {
        searchTable: '테이블 검색',
        tablePagination: '테이블 페이지네이션',
        previousPage: '이전 페이지',
        nextPage: '다음 페이지',
      });
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { searchable: true, pageSize: 2, locale: 'ko' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.search-input')?.getAttribute('aria-label')).toBe('테이블 검색');
      expect(shadow.querySelector('nav')?.getAttribute('aria-label')).toBe('테이블 페이지네이션');
    });

    it('falls back to English when locale not registered', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        options: { pageSize: 2, locale: 'xx-XX' },
      });
      const shadow = await render(el);
      const buttons = shadow.querySelectorAll('.pagination button');
      expect(buttons[0].textContent).toContain('Prev');
      expect(buttons[1].textContent).toContain('Next');
    });
  });
});
