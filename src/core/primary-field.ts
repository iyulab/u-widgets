/**
 * The single data field that holds a widget's headline/live value, for widget types where that's
 * unambiguous. `required: true` in `WIDGET_DATA_FIELDS` (widget-meta.ts) can't answer this alone
 * — some widgets (`status`, `stat-group`) have more than one required field, and the non-value
 * ones (e.g. `status.label`) are typically static captions, not something a consumer binds to a
 * live source. Widgets with free-form user-defined mapping (`chart.*`, `table`, `list`, ...) have
 * no single fixed headline field and correctly return `undefined`.
 *
 * Deliberately its own module, not part of widget-meta.ts: widget-meta.ts's other exports are
 * large doc-string registries used only by the MCP server `help()` output and the demo props
 * panel — pulling this single small lookup in from there dragged that whole module's chunk into
 * the main bundle's dependency graph.
 */
const WIDGET_PRIMARY_DATA_FIELD: Readonly<Record<string, string>> = {
  metric: 'value',
  'stat-group': 'value',
  gauge: 'value',
  progress: 'value',
  status: 'value',
};

export function getPrimaryDataField(widget: string): string | undefined {
  return WIDGET_PRIMARY_DATA_FIELD[widget];
}
