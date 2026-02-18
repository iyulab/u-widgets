import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetColumnDefinition, UWidgetEvent } from '../core/types.js';
import { formatValue } from '../core/format.js';
import { getLocaleStrings } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';

type SortDir = 'asc' | 'desc' | null;

@customElement('u-table')
export class UTable extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-table / inline-size;
    }

    /* ── table ── */
    .table-wrapper {
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--u-widget-border, #e2e8f0) transparent;
    }
    .table-wrapper::-webkit-scrollbar { height: 4px; }
    .table-wrapper::-webkit-scrollbar-thumb {
      background: var(--u-widget-border, #e2e8f0);
      border-radius: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    th {
      text-align: left;
      font-weight: 600;
      color: var(--u-widget-text-secondary, #64748b);
      padding: 8px 12px;
      border-bottom: 2px solid var(--u-widget-border, #e2e8f0);
      white-space: nowrap;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    th[data-sortable] {
      cursor: pointer;
      user-select: none;
    }

    th[data-sortable]:hover,
    th[data-sortable]:focus-visible {
      color: var(--u-widget-text, #1a1a2e);
      outline: 2px solid var(--u-widget-primary, #4f46e5);
      outline-offset: -2px;
    }

    .sort-arrow {
      margin-left: 4px;
      font-size: 0.6875rem;
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--u-widget-border, #e2e8f0);
      color: var(--u-widget-text, #1a1a2e);
    }

    tbody tr {
      cursor: pointer;
      outline: none;
    }

    tbody tr:hover td {
      background: var(--u-widget-surface, #f1f5f9);
    }

    tbody tr:focus td {
      background: var(--u-widget-surface, #f1f5f9);
    }

    tbody tr:focus {
      box-shadow: inset 3px 0 0 var(--u-widget-primary, #4f46e5);
    }

    tr:last-child td {
      border-bottom: none;
    }

    th[data-align='center'],
    td[data-align='center'] {
      text-align: center;
    }

    th[data-align='right'],
    td[data-align='right'] {
      text-align: right;
    }

    /* ── list ── */
    .list-container {
      display: flex;
      flex-direction: column;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--u-widget-border, #e2e8f0);
      cursor: pointer;
      outline: none;
    }

    .list-item:hover {
      background: var(--u-widget-surface, #f1f5f9);
    }

    .list-item:focus {
      background: var(--u-widget-surface, #f1f5f9);
      box-shadow: inset 3px 0 0 var(--u-widget-primary, #4f46e5);
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .list-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--u-widget-surface, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    .list-avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .list-content {
      flex: 1;
      min-width: 0;
    }

    .list-primary {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--u-widget-text, #1a1a2e);
    }

    .list-secondary {
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
      margin-top: 2px;
    }

    .list-trailing {
      flex-shrink: 0;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--u-widget-text-secondary, #64748b);
    }

    /* ── search ── */
    .search-box {
      margin-bottom: 8px;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      font-size: 0.8125rem;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 4px;
      outline: none;
      font-family: inherit;
      color: var(--u-widget-text, #1a1a2e);
      background: var(--u-widget-bg, #fff);
    }

    .search-input:focus {
      border-color: var(--u-widget-primary, #4f46e5);
    }

    /* ── pagination ── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    .pagination button {
      padding: 4px 10px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 4px;
      background: var(--u-widget-bg, #fff);
      color: var(--u-widget-text, #1a1a2e);
      cursor: pointer;
      font-size: 0.75rem;
      font-family: inherit;
    }

    .pagination button:hover:not(:disabled) {
      background: var(--u-widget-surface, #f1f5f9);
    }

    .pagination button:disabled {
      opacity: 0.4;
      cursor: default;
    }

    /* ── compact ── */
    .compact table {
      font-size: 0.75rem;
    }

    .compact th {
      padding: 4px 8px;
      font-size: 0.6875rem;
    }

    .compact td {
      padding: 4px 8px;
    }

    .compact .list-item {
      padding: 6px 0;
      gap: 8px;
    }

    .compact .list-icon {
      width: 24px;
      height: 24px;
      font-size: 0.625rem;
    }

    .compact .list-avatar {
      width: 24px;
      height: 24px;
    }

    .compact .list-primary {
      font-size: 0.75rem;
    }

    .compact .list-secondary {
      font-size: 0.6875rem;
    }

    .compact .list-trailing {
      font-size: 0.6875rem;
    }

    /* ── container-query responsive ── */
    @container u-table (max-width: 30rem) {
      table {
        font-size: 0.75rem;
      }

      th {
        padding: 4px 8px;
        font-size: 0.6875rem;
      }

      td {
        padding: 4px 8px;
      }

      .list-item {
        padding: 6px 0;
        gap: 8px;
      }

      .list-icon,
      .list-avatar {
        width: 24px;
        height: 24px;
      }

      .list-primary {
        font-size: 0.75rem;
      }

      .list-secondary,
      .list-trailing {
        font-size: 0.6875rem;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @state()
  private _sortField: string | null = null;

  @state()
  private _sortDir: SortDir = null;

  @state()
  private _page = 0;

  @state()
  private _searchQuery = '';

  @state()
  private _focusedIdx = 0;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('spec')) {
      this._sortField = null;
      this._sortDir = null;
      this._page = 0;
      this._searchQuery = '';
      this._focusedIdx = 0;
    }
  }

  render() {
    if (!this.spec?.data || !Array.isArray(this.spec.data)) return nothing;

    if (this.spec.widget === 'list') {
      return this.renderList();
    }

    return this.renderTable();
  }

  private get _locale() {
    const locale = this.spec?.options?.locale;
    return getLocaleStrings(typeof locale === 'string' ? locale : undefined);
  }

  private renderTable() {
    const data = this.spec!.data as Record<string, unknown>[];
    const columns = this.getColumns(data);
    const locale = this._locale;
    const sortable = this.spec!.options?.sortable !== false;
    const searchable = !!this.spec!.options?.searchable;
    const compact = !!this.spec!.options?.compact;
    const pageSize = Number(this.spec!.options?.pageSize) || 0;

    // Pipeline: filter → sort → paginate
    const filtered = this._searchQuery ? this.filterData(data, columns) : data;
    const sorted = this._sortField && this._sortDir ? this.sortData(filtered) : filtered;
    const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
    const page = Math.min(this._page, totalPages - 1);
    const visible = pageSize > 0 ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

    const searchBox = searchable ? html`
      <div class="search-box" part="search">
        <input
          class="search-input"
          type="text"
          placeholder=${locale.searchPlaceholder}
          aria-label=${locale.searchTable}
          .value=${this._searchQuery}
          @input=${this._onSearch}
        />
      </div>
    ` : nothing;

    const paginationBar = pageSize > 0 && totalPages > 1 ? html`
      <nav class="pagination" part="pagination" aria-label=${locale.tablePagination}>
        <button aria-label=${locale.previousPage} ?disabled=${page === 0} @click=${() => this._onPageChange(page - 1)}>${locale.prev}</button>
        <span aria-live="polite">${page + 1} / ${totalPages}</span>
        <button aria-label=${locale.nextPage} ?disabled=${page >= totalPages - 1} @click=${() => this._onPageChange(page + 1)}>${locale.next}</button>
      </nav>
    ` : nothing;

    return html`<div class="table-container${compact ? ' compact' : ''}">
      ${searchBox}
      <div class="table-wrapper" part="table">
        <table aria-label=${this.spec!.title ?? locale.dataTable}>
          <thead>
            <tr>
              ${columns.map(
                (col) => html`<th
                  scope="col"
                  data-align=${col.align ?? 'left'}
                  ?data-sortable=${sortable}
                  tabindex=${sortable ? '0' : nothing}
                  @click=${sortable ? () => this._onSort(col.field) : undefined}
                  @keydown=${sortable ? (e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      this._onSort(col.field);
                    }
                  } : undefined}
                  aria-sort=${this._sortField === col.field && this._sortDir
                    ? this._sortDir === 'asc' ? 'ascending' : 'descending'
                    : 'none'}
                  part="th"
                >${col.label ?? col.field}${this._sortField === col.field && this._sortDir
                    ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>`
                    : nothing}</th>`,
              )}
            </tr>
          </thead>
          <tbody @keydown=${this._onTableKeydown}>
            ${visible.map(
              (row, idx) => html`
                <tr part="tr"
                  tabindex=${idx === this._focusedIdx ? '0' : '-1'}
                  @click=${() => this._onRowClick(row, pageSize > 0 ? page * pageSize + idx : idx)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      this._onRowClick(row, pageSize > 0 ? page * pageSize + idx : idx);
                    }
                  }}
                >
                  ${columns.map(
                    (col) =>
                      html`<td data-align=${col.align ?? 'left'} part="td"
                        >${formatValue(row[col.field], col.format, typeof this.spec!.options?.locale === 'string' ? this.spec!.options.locale : undefined)}</td
                      >`,
                  )}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
      ${paginationBar}
    </div>`;
  }

  private _onTableKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const row = target.closest('tr');
    if (!row) return;

    const tbody = row.parentElement;
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const idx = rows.indexOf(row);
    let nextIdx = -1;

    switch (e.key) {
      case 'ArrowDown':
        nextIdx = Math.min(idx + 1, rows.length - 1);
        break;
      case 'ArrowUp':
        nextIdx = Math.max(idx - 1, 0);
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = rows.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    if (nextIdx !== idx && nextIdx >= 0) {
      this._focusedIdx = nextIdx;
      this.updateComplete.then(() => {
        const newRows = this.shadowRoot?.querySelectorAll('tbody tr');
        (newRows?.[nextIdx] as HTMLElement)?.focus();
      });
    }
  };

  private _onListKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const item = target.closest('.list-item') as HTMLElement | null;
    if (!item) return;

    const container = item.parentElement;
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.list-item')) as HTMLElement[];
    const idx = items.indexOf(item);
    let nextIdx = -1;

    switch (e.key) {
      case 'ArrowDown':
        nextIdx = Math.min(idx + 1, items.length - 1);
        break;
      case 'ArrowUp':
        nextIdx = Math.max(idx - 1, 0);
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = items.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    if (nextIdx !== idx && nextIdx >= 0) {
      this._focusedIdx = nextIdx;
      this.updateComplete.then(() => {
        const newItems = this.shadowRoot?.querySelectorAll('.list-item');
        (newItems?.[nextIdx] as HTMLElement)?.focus();
      });
    }
  };

  private _onPageChange(newPage: number) {
    this._page = newPage;
    this._focusedIdx = 0;
    this.updateComplete.then(() => {
      const firstRow = this.shadowRoot?.querySelector('tbody tr[tabindex="0"]') as HTMLElement | null;
      firstRow?.focus();
    });
  }

  private _onSearch = (e: Event) => {
    this._searchQuery = (e.target as HTMLInputElement).value;
    this._page = 0;
  };

  private filterData(data: Record<string, unknown>[], columns: UWidgetColumnDefinition[]): Record<string, unknown>[] {
    const q = this._searchQuery.toLowerCase();
    const fields = columns.map((c) => c.field);
    return data.filter((row) =>
      fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q)),
    );
  }

  private _onSort(field: string) {
    if (this._sortField === field) {
      // cycle: asc → desc → none
      if (this._sortDir === 'asc') {
        this._sortDir = 'desc';
      } else {
        this._sortField = null;
        this._sortDir = null;
      }
    } else {
      this._sortField = field;
      this._sortDir = 'asc';
    }
  }

  private sortData(data: Record<string, unknown>[]): Record<string, unknown>[] {
    const field = this._sortField!;
    const dir = this._sortDir!;
    return [...data].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        // Try numeric comparison for string values that look like numbers
        const an = Number(av), bn = Number(bv);
        cmp = (String(av) !== '' && String(bv) !== '' && !isNaN(an) && !isNaN(bn))
          ? an - bn
          : String(av).localeCompare(String(bv));
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  private renderList() {
    const data = this.spec!.data as Record<string, unknown>[];
    const mapping = this.spec!.mapping;
    const compact = !!this.spec!.options?.compact;
    const primaryKey = mapping?.primary ?? this.inferPrimaryKey(data);
    const secondaryKey = mapping?.secondary;
    const iconKey = mapping?.icon;
    const avatarKey = mapping?.avatar;
    const trailingKey = mapping?.trailing;

    return html`
      <div class="list-container${compact ? ' compact' : ''}" part="list" @keydown=${this._onListKeydown}>
        ${data.map(
          (item, idx) => html`
            <div class="list-item" part="list-item"
              tabindex=${idx === this._focusedIdx ? '0' : '-1'}
              @click=${() => this._onRowClick(item, idx)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this._onRowClick(item, idx);
                }
              }}
            >
              ${avatarKey && item[avatarKey]
                ? html`<img class="list-avatar" src=${String(item[avatarKey])} alt="" part="avatar" />`
                : iconKey
                  ? html`<div class="list-icon" part="icon">${this.getIconLetter(item[iconKey])}</div>`
                  : nothing}
              <div class="list-content">
                <div class="list-primary" part="primary">${item[primaryKey] ?? ''}</div>
                ${secondaryKey
                  ? html`<div class="list-secondary" part="secondary">${item[secondaryKey] ?? ''}</div>`
                  : nothing}
              </div>
              ${trailingKey && item[trailingKey] != null
                ? html`<div class="list-trailing" part="trailing">${item[trailingKey]}</div>`
                : nothing}
            </div>
          `,
        )}
      </div>
    `;
  }

  private _onRowClick(row: Record<string, unknown>, index: number) {
    if (!this.spec) return;
    const detail: UWidgetEvent = {
      type: 'select',
      widget: this.spec.widget,
      id: this.spec.id,
      data: { ...row, _index: index },
    };
    this.dispatchEvent(
      new CustomEvent('u-widget-internal', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private getColumns(data: Record<string, unknown>[]): UWidgetColumnDefinition[] {
    if (this.spec!.mapping?.columns) return this.spec!.mapping.columns;

    // Auto-infer from first record
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((field) => ({ field }));
  }

  private inferPrimaryKey(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    const keys = Object.keys(data[0]);
    // Prefer well-known primary key names
    const primaryCandidates = ['name', 'title', 'label', 'id', 'key'];
    for (const candidate of primaryCandidates) {
      if (keys.includes(candidate)) return candidate;
    }
    // Fallback: first string field
    const sample = data[0];
    const stringKey = keys.find((k) => typeof sample[k] === 'string');
    return stringKey ?? keys[0] ?? '';
  }

  private getIconLetter(value: unknown): string {
    const str = String(value ?? '');
    return str.charAt(0).toUpperCase();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-table': UTable;
  }
}
