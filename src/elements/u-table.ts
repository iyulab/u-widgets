import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetColumnDefinition, UWidgetEvent } from '../core/types.js';
import { formatValue } from '../core/format.js';

type SortDir = 'asc' | 'desc' | null;

@customElement('u-table')
export class UTable extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* ── table ── */
    .table-wrapper {
      overflow-x: auto;
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

    th[data-sortable]:hover {
      color: var(--u-widget-text, #1a1a2e);
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
    }

    tbody tr:hover td {
      background: var(--u-widget-surface, #f1f5f9);
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
    }

    .list-item:hover {
      background: var(--u-widget-surface, #f1f5f9);
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
  `;

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @state()
  private _sortField: string | null = null;

  @state()
  private _sortDir: SortDir = null;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('spec')) {
      this._sortField = null;
      this._sortDir = null;
    }
  }

  render() {
    if (!this.spec?.data || !Array.isArray(this.spec.data)) return nothing;

    if (this.spec.widget === 'list') {
      return this.renderList();
    }

    return this.renderTable();
  }

  private renderTable() {
    const data = this.spec!.data as Record<string, unknown>[];
    const columns = this.getColumns(data);
    const sortable = this.spec!.options?.sortable !== false;
    const sorted = this._sortField && this._sortDir ? this.sortData(data) : data;

    return html`
      <div class="table-wrapper" part="table">
        <table aria-label=${this.spec!.title ?? 'Data table'}>
          <thead>
            <tr>
              ${columns.map(
                (col) => html`<th
                  scope="col"
                  data-align=${col.align ?? 'left'}
                  ?data-sortable=${sortable}
                  @click=${sortable ? () => this._onSort(col.field) : undefined}
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
          <tbody>
            ${sorted.map(
              (row, idx) => html`
                <tr part="tr" @click=${() => this._onRowClick(row, idx)}>
                  ${columns.map(
                    (col) =>
                      html`<td data-align=${col.align ?? 'left'} part="td"
                        >${formatValue(row[col.field], col.format)}</td
                      >`,
                  )}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
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
        cmp = String(av).localeCompare(String(bv));
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  private renderList() {
    const data = this.spec!.data as Record<string, unknown>[];
    const mapping = this.spec!.mapping;
    const primaryKey = mapping?.primary ?? this.inferPrimaryKey(data);
    const secondaryKey = mapping?.secondary;
    const iconKey = mapping?.icon;
    const avatarKey = mapping?.avatar;
    const trailingKey = mapping?.trailing;

    return html`
      <div class="list-container" part="list">
        ${data.map(
          (item, idx) => html`
            <div class="list-item" part="list-item" @click=${() => this._onRowClick(item, idx)}>
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
    return Object.keys(data[0])[0] ?? '';
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
