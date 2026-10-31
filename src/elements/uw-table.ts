import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetColumnDefinition, UWidgetEvent } from '../core/types.js';
import { formatValue } from '../core/format.js';
import { getLocaleStrings } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';
import { normalizeTone, toneLabel, toneMark, toneStyles, TONE_GLYPHS, type Tone } from '../core/tone.js';
import { formatTemplate } from '../core/locale.js';
import { matchesSearch, searchesWhileComposing } from '../core/search.js';
import { isDateLikeString } from '../core/utils.js';
import { checkMediaUrl } from '../core/media.js';

type SortDir = 'asc' | 'desc' | null;

@customElement('uw-table')
export class UwTable extends LitElement {
  static styles = [themeStyles, toneStyles, css`
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      container: uw-table / inline-size;
    }

    /* 제약 전달 사슬: 호스트 → .table-container → .table-wrapper.
       ⚠.table-container 는 종전에 선언이 아예 없었다(렌더에만 존재) — 제약이 바로 여기서
       끊겨, 호스트에 max-height 를 줘도 표가 원래 높이로 그려지며 상자 밖으로 샜다. */
    .table-container {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    /* ── table ── */
    .table-wrapper {
      flex: 1 1 auto;
      min-height: 0;
      overflow-x: auto;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--u-widget-border, #e2e8f0) transparent;
    }
    .table-wrapper::-webkit-scrollbar { height: 4px; width: 4px; }
    .table-wrapper::-webkit-scrollbar-thumb {
      background: var(--u-widget-border, #e2e8f0);
      border-radius: 2px;
    }

    table {
      min-width: 100%;
      border-collapse: collapse;
      font-size: var(--u-widget-font-size, 0.875rem);
    }

    th {
      text-align: left;
      font-weight: 600;
      color: var(--u-widget-text-secondary, #5b6777);
      padding: 8px 12px;
      border-bottom: 2px solid var(--u-widget-border, #e2e8f0);
      white-space: nowrap;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
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
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--u-widget-border, #e2e8f0);
      color: var(--u-widget-text, #1a1a2e);
      white-space: nowrap;
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

    /* A right-aligned column is a column of figures: set in the figure face, digits of one width. */
    td[data-align='right'] {
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
    }

    /* ── column tone (core/tone.ts): bold, in the tone's colour ── */
    td[data-tone] {
      font-weight: 600;
      color: var(--tone);
    }

    /* A row's tone: a stripe and a tint, its mark first; a place in a sequence dims what is done and picks out what is now. */
    tbody tr[data-tone] td:first-child { box-shadow: inset 3px 0 0 var(--tone); }
    tbody tr[data-tone]:not([data-tone='past']):not([data-tone='next']) td { background: color-mix(in srgb, var(--tone) 9%, transparent); }
    tbody tr[data-tone='past'] td { opacity: 0.6; }
    tbody tr[data-tone='now'] td { font-weight: 700; }
    .row-mark { color: var(--tone); margin-right: 6px; }
    .cell-mark { margin-right: 4px; }

    /* A bar cell: the value against its column's scale, written beside it. */
    .cell-bar { display: inline-flex; align-items: center; gap: 8px; width: 100%; min-width: 80px; }
    .cell-bar-track {
      flex: 1 1 auto;
      height: 8px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--u-widget-text-secondary, #5b6777) 18%, transparent);
      overflow: hidden;
    }
    /* The bar is in its cell's own tone — not the row's, which the row's stripe and mark already say. */
    .cell-bar-fill { display: block; height: 100%; border-radius: inherit; background: var(--u-widget-primary, #4f46e5); }
    td[data-tone] .cell-bar-fill { background: var(--tone); }
    .cell-bar-text { flex: none; font-family: var(--u-widget-font-numeric); font-variant-numeric: tabular-nums; }

    /* A table only to be looked at — on a wall, on a board: no sorting, no focus, no row to pick. */
    .table-container[data-static] tbody tr { cursor: default; }
    /* Its rows do not scroll under a pager, so what follows them — the «more» line — sits right under them. */
    .table-container[data-static] .table-wrapper { flex: 0 1 auto; }
    .table-container[data-static] tbody tr:hover td { background: none; }
    .table-container[data-static] tbody tr[data-tone]:not([data-tone='past']):not([data-tone='next']):hover td {
      background: color-mix(in srgb, var(--tone) 9%, transparent);
    }
    .table-more {
      padding: 6px 12px;
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
    }

    /* ── list ── */
    /* 표의 .table-wrapper 와 같은 이유로 목록도 스크롤 주인이 된다 — 호스트 제약이 없으면
       종전처럼 전체 항목 높이로 자란다. */
    .list-container {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0 10px 8px;
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
      font-size: var(--u-widget-font-size-caption, 0.75rem);
      color: var(--u-widget-text-secondary, #5b6777);
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

    /* A long word breaks inside its own column instead of running under the values beside it. */
    .list-primary,
    .list-secondary {
      overflow-wrap: anywhere;
    }

    .list-primary {
      font-size: var(--u-widget-font-size, 0.875rem);
      font-weight: 500;
      color: var(--u-widget-text, #1a1a2e);
    }

    .list-secondary {
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
      margin-top: 2px;
    }

    .list-trailing {
      flex-shrink: 0;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      font-weight: 500;
      color: var(--u-widget-text-secondary, #5b6777);
    }

    /* A row's tone: its mark in the tone's colour; a place in a sequence dims what is done and picks out what is now. */
    .list-mark {
      flex: none;
      width: 1em;
      text-align: center;
      color: var(--tone);
      font-size: var(--u-widget-font-size-label, 0.8125rem);
    }
    .list-item[data-tone] .list-primary { color: var(--tone); }
    .list-item[data-tone='past'] { opacity: 0.6; }
    .list-item[data-tone='past'] .list-primary,
    .list-item[data-tone='next'] .list-primary { color: var(--u-widget-text, #1a1a2e); }
    .list-item[data-tone='now'] {
      background: color-mix(in srgb, var(--tone) 10%, transparent);
    }
    .list-item[data-tone='now'] .list-primary { font-weight: 700; }

    .list-time {
      flex: none;
      min-width: 3.2em;
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .list-cell {
      flex: none;
      min-width: 3em;
      text-align: right;
      font-family: var(--u-widget-font-numeric);
      font-variant-numeric: tabular-nums;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
    }
    .list-cell[data-align='left'] { text-align: left; }
    .list-cell[data-align='center'] { text-align: center; }
    .list-cell[data-tone] { color: var(--tone); font-weight: 600; }

    .list-head {
      display: flex;
      gap: 12px;
      padding: 0 0 4px 8px;
      border-bottom: 1px solid var(--u-widget-border, #e2e8f0);
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      flex: none;
    }
    .list-head .list-content { flex: 1; }

    .list-more {
      flex: none;
      padding: 6px 0 2px 8px;
      color: var(--u-widget-text-secondary, #5b6777);
      font-size: var(--u-widget-font-size-caption, 0.75rem);
    }

    /* A row with a time or columns is one line, like a timetable: the text gives way with an ellipsis. */
    .one-line .list-primary,
    .one-line .list-secondary {
      overflow-wrap: normal;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @container uw-table (max-width: 260px) {
      .list-item, .list-head { gap: 8px; }
      .list-cell { min-width: 2em; }
      .list-time { min-width: 2.8em; }
    }

    /* Tiles: each row a small card, as many to a line as fit. */
    .list-container.tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 120px), 1fr));
      align-content: start;
      gap: 8px;
    }
    .tiles .list-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 8px 10px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-left: 3px solid var(--tone, var(--u-widget-border, #e2e8f0));
      border-radius: var(--u-widget-radius, 6px);
    }
    .tiles .list-item:last-child { border-bottom: 1px solid var(--u-widget-border, #e2e8f0); }
    .tiles .list-content { width: 100%; }
    .tiles .list-cell { text-align: left; }

    .list-badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
      font-weight: 500;
      background: var(--u-widget-surface, #f1f5f9);
      color: var(--u-widget-text-secondary, #5b6777);
      white-space: nowrap;
    }

    /* ── search ── */
    .search-box {
      flex: none;
      margin-bottom: 8px;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
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
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      font-size: var(--u-widget-font-size-label, 0.8125rem);
      color: var(--u-widget-text-secondary, #5b6777);
    }

    .pagination button {
      padding: 4px 10px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 4px;
      background: var(--u-widget-bg, #fff);
      color: var(--u-widget-text, #1a1a2e);
      cursor: pointer;
      font-size: var(--u-widget-font-size-caption, 0.75rem);
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
      font-size: var(--u-widget-font-size-caption, 0.75rem);
    }

    .compact th {
      padding: 4px 8px;
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
    }

    .compact td {
      padding: 4px 8px;
    }

    .compact .list-item {
      padding: 6px 0 6px 8px;
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
      font-size: var(--u-widget-font-size-caption, 0.75rem);
    }

    .compact .list-secondary {
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
    }

    .compact .list-trailing {
      font-size: var(--u-widget-font-size-overline, 0.6875rem);
    }

    /* ── container-query responsive ── */
    @container uw-table (max-width: 30rem) {
      table {
        font-size: var(--u-widget-font-size-caption, 0.75rem);
      }

      /* 압축 모드의 셀은 포인터 타깃(정렬 가능한 th · 행 클릭 tr)이라 24px 하한(WCAG 2.2
         SC 2.5.8)을 지켜야 하는데, line-height:normal 은 글꼴 메트릭을 따라간다 — 11px 글자에
         Windows 는 16px, Linux 기본 글꼴은 14px 을 줘서 th 가 24 와 22 로 갈렸다(e2e 게이트가
         CI 에서 처음 돈 날 드러났다). 명시 line-height 로 상자 높이를 글꼴에서 떼어 낸다. */
      th {
        padding: 4px 8px;
        font-size: var(--u-widget-font-size-overline, 0.6875rem);
        line-height: 1.5;
      }

      td {
        padding: 4px 8px;
        line-height: 1.5;
      }

      .list-item {
        padding: 6px 0 6px 8px;
        gap: 8px;
      }

      .list-icon,
      .list-avatar {
        width: 24px;
        height: 24px;
      }

      .list-primary {
        font-size: var(--u-widget-font-size-caption, 0.75rem);
      }

      .list-secondary,
      .list-trailing {
        font-size: var(--u-widget-font-size-overline, 0.6875rem);
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  @state()
  private _sortField: string | null = null;

  @state()
  private _sortDir: SortDir = null;

  @state()
  private _page = 0;

  @state()
  private _searchQuery = '';

  /** 검색어의 마지막 음절이 아직 조합 중인가 — 검색 일치가 그 음절을 자모 앞부분으로 견준다. 상태다: 확정은 글자를 바꾸지 않고
   *  이것만 바꾼다(«서» 조합 → «서» 확정). */
  @state()
  private _searchComposing = false;

  @state()
  private _focusedIdx = 0;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('spec')) {
      this._sortField = null;
      this._sortDir = null;
      this._page = 0;
      this._searchQuery = '';
      this._searchComposing = false;
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
    // `interactive: false` is a table only to be looked at — no search, sort, pages, row focus or selection.
    const interactive = this.spec!.options?.interactive !== false;
    const sortable = interactive && this.spec!.options?.sortable !== false;
    const searchable = interactive && !!this.spec!.options?.searchable;
    const compact = !!this.spec!.options?.compact;
    const rawPageSize = this.spec!.options?.pageSize;
    const pageSize = !interactive ? 0 : rawPageSize != null
      ? Number(rawPageSize)
      : data.length > 1000 ? 100 : 0;
    const rawMaxItems = this.spec!.options?.maxItems;
    const maxItems = pageSize === 0 && typeof rawMaxItems === 'number' && rawMaxItems > 0 ? Math.floor(rawMaxItems) : undefined;
    const rowToneKey = this.spec!.mapping?.tone;
    const rowGlyphKey = this.spec!.mapping?.glyph;
    const localeName = typeof this.spec!.options?.locale === 'string' ? this.spec!.options.locale : undefined;
    const cell = this.cellRenderer(columns, data, localeName);

    // Pipeline: filter → sort → paginate
    const filtered = this._searchQuery ? this.filterData(data, columns) : data;
    const sorted = this._sortField && this._sortDir ? this.sortData(filtered) : filtered;
    const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
    const page = Math.min(this._page, totalPages - 1);
    const paged = pageSize > 0 ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;
    const visible = maxItems !== undefined ? paged.slice(0, maxItems) : paged;
    const hidden = paged.length - visible.length;
    // select reports a row's index in spec.data — its position on screen changes with search, sort
    // and paging. Filtering and sorting keep the row objects, so identity maps them back.
    const sourceIndex = new Map<Record<string, unknown>, number>();
    data.forEach((row, i) => { if (!sourceIndex.has(row)) sourceIndex.set(row, i); });

    const searchBox = searchable ? html`
      <div class="search-box" part="search">
        <input
          class="search-input"
          type="text"
          placeholder=${locale.searchPlaceholder}
          aria-label=${locale.searchTable}
          .value=${this._searchQuery}
          @input=${this._onSearch}
          @compositionend=${this._onSearch}
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

    return html`<div class="table-container${compact ? ' compact' : ''}" ?data-static=${!interactive}>
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
            ${visible.map((row, idx) => {
              const rowTone = rowToneKey ? normalizeTone(row[rowToneKey], 'uw-table') : undefined;
              const mark = rowTone
                ? html`<span class="row-mark" part="mark" role="img" aria-label=${toneLabel(rowTone, locale)}>${toneMark(rowTone, rowGlyphKey ? row[rowGlyphKey] : undefined)}</span>`
                : nothing;
              const cells = columns.map((col, c) => {
                const { tone, content } = cell(col, row);
                return html`<td data-align=${col.align ?? 'left'} data-tone=${tone ?? nothing} part="td">${c === 0 ? mark : nothing}${content}</td>`;
              });
              return interactive
                ? html`
                <tr part="tr" data-tone=${rowTone ?? nothing}
                  tabindex=${idx === this._focusedIdx ? '0' : '-1'}
                  @click=${() => this._onRowClick(row, sourceIndex.get(row) ?? idx)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      this._onRowClick(row, sourceIndex.get(row) ?? idx);
                    }
                  }}
                >${cells}</tr>`
                : html`<tr part="tr" data-tone=${rowTone ?? nothing}>${cells}</tr>`;
            })}
          </tbody>
        </table>
      </div>
      ${hidden > 0 ? html`<div class="table-more" part="more">${formatTemplate(locale.moreItems, { count: hidden })}</div>` : nothing}
      ${paginationBar}
    </div>`;
  }

  /**
   * How each cell of these columns is drawn: its value formatted, with the column's unit; coloured by the column's
   * tone or the row's own (`toneField`); as a bar against the column's scale (`cell: "bar"`) or, when the value is a
   * tone, as its mark and name (`cell: "tone"`).
   */
  private cellRenderer(columns: UWidgetColumnDefinition[], data: Record<string, unknown>[], localeName?: string) {
    const strings = this._locale;
    const scales = new Map<string, number>();
    for (const col of columns) {
      if (col.cell !== 'bar') continue;
      const own = Number(col.max);
      const largest = Math.max(0, ...data.map(r => Number(r[col.field])).filter(Number.isFinite));
      scales.set(col.field, Number.isFinite(own) && own > 0 ? own : largest);
    }
    return (col: UWidgetColumnDefinition, row: Record<string, unknown>): { tone?: Tone; content: unknown } => {
      const raw = row[col.field];
      if (col.cell === 'tone') {
        const tone = normalizeTone(raw, 'uw-table');
        return tone
          ? { tone, content: html`<span class="cell-mark" aria-hidden="true">${TONE_GLYPHS[tone]}</span>${toneLabel(tone, strings)}` }
          : { content: raw ?? '' };
      }
      const tone = (col.toneField ? normalizeTone(row[col.toneField], 'uw-table') : undefined) ?? normalizeTone(col.tone, 'uw-table');
      const empty = raw == null || raw === '';
      const text = `${formatValue(raw, col.format, localeName)}${col.unit && !empty ? `\u00a0${col.unit}` : ''}`;
      if (col.cell === 'bar' && !empty && Number.isFinite(Number(raw))) {
        const scale = scales.get(col.field) ?? 0;
        const fraction = scale > 0 ? Math.min(1, Math.max(0, Number(raw) / scale)) : 0;
        return {
          tone,
          content: html`<span class="cell-bar"><span class="cell-bar-track" aria-hidden="true"><span class="cell-bar-fill" style="width:${(fraction * 100).toFixed(1)}%"></span></span><span class="cell-bar-text">${text}</span></span>`,
        };
      }
      return { tone, content: text };
    };
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

  /**
   * IME 조합 중인 음절(«서울» 의 가는 길 «ㅅ» · «성»)을 글자 그대로 견주면 찾는 행을 숨기고 빈 표를 보인다. 조합 중을 읽는
   * 검색 일치(`./components` — 자모 앞부분)가 있으면 그것으로 치는 도중에도 좁히고, 없으면 조합 중 `input` 은 건너뛰고(상자의
   * 글자는 그대로 둔다 — 바인딩 값이 바뀌지 않으면 다시 쓰지 않는다) 조합이 끝나면 확정 글자로 거른다.
   */
  private _onSearch = (e: Event) => {
    const composing = !!(e as InputEvent).isComposing;
    if (composing && !searchesWhileComposing()) return;
    this._searchComposing = composing;
    this._searchQuery = (e.target as HTMLInputElement).value;
    this._page = 0;
  };

  private filterData(data: Record<string, unknown>[], columns: UWidgetColumnDefinition[]): Record<string, unknown>[] {
    const q = this._searchQuery;
    const fields = columns.map((c) => c.field);
    const locale = typeof this.spec?.options?.locale === 'string' ? this.spec.options.locale : undefined;
    const options = { composing: this._searchComposing, locale };
    return data.filter((row) => fields.some((f) => matchesSearch(String(row[f] ?? ''), q, options)));
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
    const badgeKey = mapping?.badge;
    const timeKey = mapping?.time;
    const toneKey = mapping?.tone;
    const glyphKey = mapping?.glyph;
    const columns = (mapping?.columns ?? []).filter(c => c && typeof c.field === 'string');
    const options = this.spec!.options ?? {};
    const tiles = options.layout === 'tiles';
    const locale = typeof options.locale === 'string' ? options.locale : undefined;
    const maxItems = typeof options.maxItems === 'number' && options.maxItems > 0 ? Math.floor(options.maxItems) : undefined;
    const shown = maxItems !== undefined ? data.slice(0, maxItems) : data;
    const hidden = data.length - shown.length;
    const cell = this.cellRenderer(columns, data, locale);
    // A time column reads a time of day from a date-time a source sends; anything else is shown as it is.
    const timeText = (v: unknown) => (typeof v === 'string' && isDateLikeString(v) && v.includes('T') ? formatValue(v, 'time', locale) : v ?? '');
    const head = !tiles && columns.some(c => c.label)
      ? html`<div class="list-head" part="list-head" aria-hidden="true">
          ${timeKey ? html`<span class="list-time"></span>` : nothing}
          <span class="list-content"></span>
          ${columns.map(c => html`<span class="list-cell" data-align=${c.align ?? 'right'}>${c.label ?? ''}</span>`)}
        </div>`
      : nothing;

    return html`
      ${head}
      <div class="list-container${compact ? ' compact' : ''}${tiles ? ' tiles' : ''}${!tiles && (timeKey || columns.length > 0) ? ' one-line' : ''}" part="list" @keydown=${this._onListKeydown}>
        ${shown.map(
          (item, idx) => {
            const tone = toneKey ? normalizeTone(item[toneKey], 'uw-table') : undefined;
            const avatarSrc = avatarKey && item[avatarKey] ? checkMediaUrl(String(item[avatarKey]), { inlineImage: true }).src : '';
            return html`
            <div class="list-item" part="list-item" data-tone=${tone ?? nothing}
              tabindex=${idx === this._focusedIdx ? '0' : '-1'}
              @click=${() => this._onRowClick(item, idx)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this._onRowClick(item, idx);
                }
              }}
            >
              ${tone && !tiles ? html`<span class="list-mark" part="mark" aria-hidden="true">${toneMark(tone, glyphKey ? item[glyphKey] : undefined)}</span>` : nothing}
              ${timeKey ? html`<span class="list-time" part="time">${timeText(item[timeKey])}</span>` : nothing}
              ${avatarKey && avatarSrc
                ? html`<img class="list-avatar" src=${avatarSrc} alt="" part="avatar" />`
                : iconKey
                  ? html`<div class="list-icon" part="icon">${this.getIconLetter(item[iconKey])}</div>`
                  : nothing}
              <div class="list-content">
                <div class="list-primary" part="primary" title=${item[primaryKey] == null ? nothing : String(item[primaryKey])}>${item[primaryKey] ?? ''}</div>
                ${secondaryKey
                  ? html`<div class="list-secondary" part="secondary">${item[secondaryKey] ?? ''}</div>`
                  : nothing}
              </div>
              ${badgeKey && item[badgeKey] != null
                ? html`<span class="list-badge" part="badge">${item[badgeKey]}</span>`
                : nothing}
              ${columns.map(c => {
                const { tone, content } = cell(c, item);
                return html`<span class="list-cell" part="cell" data-align=${c.align ?? 'right'} data-tone=${tone ?? nothing}>${content}</span>`;
              })}
              ${trailingKey && item[trailingKey] != null
                ? html`<div class="list-trailing" part="trailing">${item[trailingKey]}</div>`
                : nothing}
            </div>
          `;
          },
        )}
      </div>
      ${hidden > 0 ? html`<div class="list-more" part="list-more">${formatTemplate(getLocaleStrings(locale).moreItems, { count: hidden })}</div>` : nothing}
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
    'uw-table': UwTable;
  }
}
