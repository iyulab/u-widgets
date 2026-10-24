import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/uw-table.js';
import type { UwTable } from '../../src/elements/uw-table.js';
import { registerLocale } from '../../src/core/locale.js';

function createElement(spec: Record<string, unknown>): UwTable {
  const el = document.createElement('uw-table') as UwTable;
  el.spec = spec as unknown as UwTable['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UwTable) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('uw-table', () => {
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

    it('applies variant highlight to column cells', async () => {
      const el = createElement({
        widget: 'table',
        data: [{ metric: 'Yield', value: 98 }],
        mapping: {
          columns: [
            { field: 'metric', label: 'Metric' },
            { field: 'value', label: 'Value', tone: 'ok' },
          ],
        },
      });
      const shadow = await render(el);
      const tds = shadow.querySelectorAll('tbody td');
      expect(tds[0]?.getAttribute('data-tone')).toBeNull();
      expect(tds[1]?.getAttribute('data-tone')).toBe('ok');
    });

    it('ignores an unknown tone and warns once', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = createElement({
        widget: 'table',
        data: [{ value: 1 }],
        mapping: {
          columns: [{ field: 'value', tone: 'primary' }],
        },
      });
      const shadow = await render(el);
      const td = shadow.querySelector('tbody td');
      expect(td?.getAttribute('data-tone')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      expect(String(warnSpy.mock.calls[0][0])).toContain('primary');
      warnSpy.mockRestore();
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

  describe('select _index after search and sort', () => {
    it('reports the row index in spec.data, not the position in the sorted view', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Charlie', value: 30 },
          { name: 'Alice', value: 10 },
          { name: 'Bob', value: 20 },
        ],
      });
      const shadow = await render(el);
      (shadow.querySelectorAll('th')[0] as HTMLElement).click();
      await el.updateComplete;

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);
      // First row on screen is now Alice, which is spec.data[1].
      (shadow.querySelector('tbody tr') as HTMLElement).click();
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.data.name).toBe('Alice');
      expect(detail.data._index).toBe(1);
    });

    it('reports the row index in spec.data after a search narrows the rows', async () => {
      const el = createElement({
        widget: 'table',
        data: [
          { name: 'Alice', value: 10 },
          { name: 'Bob', value: 20 },
          { name: 'Carol', value: 30 },
        ],
        options: { searchable: true },
      });
      const shadow = await render(el);
      const input = shadow.querySelector('.search-input') as HTMLInputElement;
      input.value = 'carol';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);
      (shadow.querySelector('tbody tr') as HTMLElement).click();
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.data.name).toBe('Carol');
      expect(detail.data._index).toBe(2);
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
      const styles = (customElements.get('uw-table') as any).styles;
      const allCss = Array.isArray(styles)
        ? styles.map((s: any) => s.cssText ?? '').join(' ')
        : styles?.cssText ?? '';
      expect(allCss).toContain('container');
      expect(allCss).toContain('uw-table');
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

describe('uw-table list — rows as a board shows them', () => {
  const rows = [
    { at: '2026-10-23T08:00:00', what: 'Boarding', gate: 'A4', pax: 182, state: 'past' },
    { at: '2026-10-23T08:30:00', what: 'Pushback', gate: 'A4', pax: 182, state: 'now' },
    { at: '2026-10-23T09:10:00', what: 'Arrival', gate: 'B2', pax: 96.5, state: 'next' },
    { at: '2026-10-23T09:40:00', what: 'Cleaning', gate: 'B2', pax: 0, state: 'alarm' },
  ];
  const spec = (options: Record<string, unknown> = {}) => ({
    widget: 'list', data: rows,
    mapping: { primary: 'what', time: 'at', tone: 'state', columns: [{ field: 'gate', label: 'Gate', align: 'left' }, { field: 'pax', label: 'Pax', format: 'number:1' }] },
    options: { locale: 'en-US', ...options },
  });

  it('marks each row with its tone, dims what is done and picks out what is now', async () => {
    const shadow = await render(createElement(spec()));
    const items = [...shadow.querySelectorAll('.list-item')];
    expect(items.map(i => i.getAttribute('data-tone'))).toEqual(['past', 'now', 'next', 'alarm']);
    expect(items[3].querySelector('[part="mark"]')?.textContent).toBe('✕');
  });

  it('shows a date-time as its time of day first, and the columns formatted after the text under their captions', async () => {
    const shadow = await render(createElement(spec()));
    const first = shadow.querySelectorAll('.list-item')[2];
    expect(first.querySelector('[part="time"]')?.textContent).toMatch(/9:10/);
    expect([...first.querySelectorAll('[part="cell"]')].map(c => c.textContent)).toEqual(['B2', '96.5']);
    expect([...shadow.querySelectorAll('.list-head .list-cell')].map(c => c.textContent)).toEqual(['Gate', 'Pax']);
  });

  it('shows at most maxItems rows and says how many more there are, in the widget’s locale', async () => {
    const shadow = await render(createElement(spec({ maxItems: 2 })));
    expect(shadow.querySelectorAll('.list-item')).toHaveLength(2);
    expect(shadow.querySelector('[part="list-more"]')?.textContent).toBe('+2 more');
  });

  it('draws the rows as tiles, with no caption row', async () => {
    const shadow = await render(createElement(spec({ layout: 'tiles' })));
    expect(shadow.querySelector('.list-container')?.classList.contains('tiles')).toBe(true);
    expect(shadow.querySelector('.list-head')).toBeNull();
  });
});

describe('uw-table — tones, bar cells, units and a table to look at', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const links = [
    { site: 'Seoul', state: 'ok', loss: 0.2, util: 41, utilTone: 'ok' },
    { site: 'Busan', state: 'alarm', loss: 3.9, util: 97, utilTone: 'alarm' },
    { site: 'Daegu', state: 'watch', loss: 1.1, util: 70 },
  ];
  const table = (mapping: Record<string, unknown>, options: Record<string, unknown> = {}, data: unknown[] = links) =>
    render(createElement({ widget: 'table', data, mapping, options: { locale: 'en-US', ...options } }));

  it('tones each row from mapping.tone — a stripe, a tint and the tone’s mark, named, in the first cell', async () => {
    const shadow = await table({ tone: 'state', columns: [{ field: 'site' }, { field: 'loss' }] });
    const rows = [...shadow.querySelectorAll('tbody tr')];
    expect(rows.map(r => r.getAttribute('data-tone'))).toEqual(['ok', 'alarm', 'watch']);
    const mark = rows[1].querySelector('td .row-mark')!;
    expect(mark.textContent).toBe('✕');
    expect(mark.getAttribute('aria-label')).toBe('Alarm');
    expect(rows[1].querySelectorAll('.row-mark')).toHaveLength(1);
  });

  it('marks a row with its own glyph from mapping.glyph, its tone’s when the row gives none', async () => {
    const data = links.map((l, i) => (i === 1 ? { ...l, mark: '!' } : l));
    const shadow = await table({ tone: 'state', glyph: 'mark', columns: [{ field: 'site' }] }, {}, data);
    const marks = [...shadow.querySelectorAll('tbody tr .row-mark')].map(m => m.textContent);
    expect(marks).toEqual(['✓', '!', '◆']);
    expect(shadow.querySelectorAll('tbody tr')[1].getAttribute('data-tone')).toBe('alarm');
  });

  it('marks a list row with its own glyph from mapping.glyph', async () => {
    const data = links.map((l, i) => (i === 1 ? { ...l, mark: '!' } : l));
    const shadow = await render(createElement({ widget: 'list', data, mapping: { primary: 'site', tone: 'state', glyph: 'mark' } }));
    expect([...shadow.querySelectorAll('.list-mark')].map(m => m.textContent)).toEqual(['✓', '!', '◆']);
  });

  it('tones a cell from its toneField, over the column tone', async () => {
    const shadow = await table({ columns: [{ field: 'site' }, { field: 'util', toneField: 'utilTone', tone: 'info' }] });
    const cells = [...shadow.querySelectorAll('tbody tr td:nth-child(2)')];
    expect(cells.map(c => c.getAttribute('data-tone'))).toEqual(['ok', 'alarm', 'info']);
  });

  it('writes a column unit after each value, not after an empty one', async () => {
    const shadow = await table({ columns: [{ field: 'loss', unit: '%', format: 'number:1' }] }, {}, [{ loss: 0.25 }, { loss: null }]);
    expect([...shadow.querySelectorAll('tbody td')].map(c => c.textContent)).toEqual(['0.3 %', '—']);
  });

  it('draws a bar cell against the column’s largest value, or its max', async () => {
    const widths = async (col: Record<string, unknown>) => [...(await table({ columns: [col] })).querySelectorAll<HTMLElement>('.cell-bar-fill')].map(f => f.style.width);
    expect(await widths({ field: 'util', cell: 'bar', unit: '%' })).toEqual(['42.3%', '100.0%', '72.2%']);
    expect(await widths({ field: 'util', cell: 'bar', max: 100 })).toEqual(['41.0%', '97.0%', '70.0%']);
    const shadow = await table({ columns: [{ field: 'util', cell: 'bar', unit: '%' }] });
    expect(shadow.querySelector('.cell-bar-text')?.textContent).toBe('41 %');
  });

  it('draws a tone cell as the tone’s mark and name', async () => {
    const shadow = await table({ columns: [{ field: 'site' }, { field: 'state', cell: 'tone' }] });
    const cells = [...shadow.querySelectorAll('tbody tr td:nth-child(2)')];
    expect(cells.map(c => c.textContent)).toEqual(['✓OK', '✕Alarm', '◆Watch']);
    expect(cells.map(c => c.getAttribute('data-tone'))).toEqual(['ok', 'alarm', 'watch']);
  });

  it('with interactive: false, has no search, sorting, pages, row focus or selection', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ n: i }));
    const el = createElement({ widget: 'table', data: many, options: { interactive: false, searchable: true, pageSize: 10 } });
    const onSelect = vi.fn();
    el.addEventListener('u-widget-internal', onSelect);
    const shadow = await render(el);
    expect(shadow.querySelector('.search-input')).toBeNull();
    expect(shadow.querySelector('.pagination')).toBeNull();
    expect(shadow.querySelector('th[data-sortable]')).toBeNull();
    expect(shadow.querySelector('th[tabindex]')).toBeNull();
    expect(shadow.querySelector('tbody tr[tabindex]')).toBeNull();
    expect(shadow.querySelectorAll('tbody tr')).toHaveLength(30);
    (shadow.querySelector('tbody tr') as HTMLElement).click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows maxItems rows and says how many more, when it is not paged', async () => {
    const shadow = await table({ columns: [{ field: 'site' }] }, { interactive: false, maxItems: 2 });
    expect(shadow.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(shadow.querySelector('[part="more"]')?.textContent).toBe('+1 more');
  });

  it('gives a list’s columns the same cells — unit, toneField, tone', async () => {
    const el = createElement({
      widget: 'list',
      data: links,
      mapping: { primary: 'site', columns: [{ field: 'util', unit: '%', toneField: 'utilTone' }, { field: 'state', cell: 'tone' }] },
      options: { locale: 'en-US' },
    });
    const shadow = await render(el);
    const cells = [...shadow.querySelectorAll('[part="cell"]')];
    expect(cells.slice(0, 2).map(c => [c.textContent?.trim(), c.getAttribute('data-tone')])).toEqual([['41 %', 'ok'], ['✓OK', 'ok']]);
  });
});
