// ── Widget Type Identifiers ──

/**
 * Chart widget type identifiers using dot notation (`chart.<variant>`).
 *
 * @example
 * ```json
 * { "widget": "chart.bar", "data": [...] }
 * ```
 */
export type ChartType =
  | 'chart.bar'
  | 'chart.line'
  | 'chart.area'
  | 'chart.pie'
  | 'chart.scatter'
  | 'chart.radar'
  | 'chart.heatmap'
  | 'chart.box'
  | 'chart.funnel'
  | 'chart.waterfall'
  | 'chart.treemap';

/**
 * All supported widget type identifiers.
 *
 * - **Display:** chart.*, metric, stat-group, gauge, progress, table, list
 * - **Input:** form, confirm
 * - **Composition:** compose
 * - **Content:** markdown, image, callout
 */
export type WidgetType =
  | ChartType
  | 'metric'
  | 'stat-group'
  | 'gauge'
  | 'progress'
  | 'table'
  | 'list'
  | 'form'
  | 'confirm'
  | 'compose'
  | 'markdown'
  | 'image'
  | 'callout';

// ── Mapping ──

/**
 * Column definition for table widgets.
 *
 * @example
 * ```json
 * { "field": "price", "label": "Price", "format": "currency", "align": "right" }
 * ```
 */
export interface UWidgetColumnDefinition {
  /** Data field name to display in this column. */
  field: string;
  /** Display header label. Defaults to the field name. */
  label?: string;
  /** Value formatting hint (e.g., `"currency"`, `"currency:EUR"`, `"percent"`). */
  format?: 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'bytes';
  /** Text alignment within the column. */
  align?: 'left' | 'center' | 'right';
}

/**
 * Mapping connects data fields to visual channels.
 *
 * Which keys are relevant depends on the widget type:
 * - **chart.bar/line/area:** `x`, `y`
 * - **chart.pie/funnel:** `label`, `value`
 * - **chart.scatter:** `x`, `y`, `color`, `size`
 * - **chart.radar:** `axis`, `value`
 * - **table:** `columns`
 * - **list:** `primary`, `secondary`, `avatar`, `icon`, `trailing`
 *
 * When omitted, mapping is auto-inferred from the data shape.
 */
export interface UWidgetMapping {
  /** Category axis field (chart x-axis). */
  x?: string;
  /** Value axis field(s). A string for single series, string[] for multi-series. */
  y?: string | string[];
  /** Label field (pie/funnel charts). */
  label?: string;
  /** Value field (pie/funnel/heatmap). */
  value?: string;
  /** Color grouping field (scatter). */
  color?: string;
  /** Size encoding field (scatter bubble). */
  size?: string;
  /** Axis field (radar chart indicators). */
  axis?: string;
  /** Explicit column definitions for table widgets. */
  columns?: UWidgetColumnDefinition[];
  /** Primary text field (list widget). */
  primary?: string;
  /** Secondary/subtitle text field (list widget). */
  secondary?: string;
  /** Icon letter field (list widget fallback when no avatar). */
  icon?: string;
  /** Avatar image URL field (list widget). */
  avatar?: string;
  /** Trailing value field displayed on the right (list widget). */
  trailing?: string;
}

/**
 * Normalized mapping where `y` is always `string[]`.
 * Produced by {@link normalizeMapping} for internal processing.
 */
export interface NormalizedMapping extends Omit<UWidgetMapping, 'y'> {
  y?: string[];
}

// ── Fields (Input Widgets) ──

/** Supported input field types for form widgets. */
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'time'
  | 'toggle'
  | 'range'
  | 'radio'
  | 'checkbox';

/**
 * Field definition for form/confirm input widgets.
 *
 * @example
 * ```json
 * { "field": "email", "label": "Email", "type": "email", "required": true }
 * ```
 */
export interface UWidgetFieldDefinition {
  /** Data field name (maps to `data[field]` for defaults and output). */
  field: string;
  /** Display label. Defaults to the field name. */
  label?: string;
  /** Input type. Defaults to `"text"`. */
  type?: FieldType;
  /** Whether the field must be filled before submit. */
  required?: boolean;
  /** Placeholder text shown when the field is empty. */
  placeholder?: string;
  /** Options for select, multiselect, radio, and checkbox types. */
  options?: string[];
  /** Minimum character length for text inputs. */
  minLength?: number;
  /** Maximum character length for text inputs. */
  maxLength?: number;
  /** Custom regex pattern for validation (e.g. `"^[A-Z]{3}$"`). */
  pattern?: string;
  /** Number of visible rows for textarea type. */
  rows?: number;
  /** Minimum value (number) or date string. */
  min?: number | string;
  /** Maximum value (number) or date string. */
  max?: number | string;
  /** Step increment for number and range inputs. */
  step?: number;
  /** Custom validation error message (overrides locale default). */
  message?: string;
}

// ── Actions ──

/**
 * Action button definition.
 *
 * Reserved actions: `"submit"`, `"cancel"`, `"navigate"`.
 * Custom action strings are forwarded to the host via the `u-widget-event`.
 *
 * @example
 * ```json
 * { "label": "Submit", "action": "submit", "style": "primary" }
 * ```
 */
export interface UWidgetAction {
  /** Button display text. */
  label: string;
  /** Action identifier emitted in the widget event. */
  action: string;
  /** Visual style hint. */
  style?: 'primary' | 'danger' | 'default';
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** URL for `"navigate"` actions. */
  url?: string;
}

// ── Events ──

/**
 * Event payload emitted by `<u-widget>` via the `u-widget-event` custom event.
 *
 * | type | trigger | payload |
 * |---|---|---|
 * | `submit` | Form submit button | Form field values |
 * | `action` | Custom action button | Action data |
 * | `change` | Input value change | Changed field and value |
 * | `select` | Chart element click | Selected data point |
 */
export interface UWidgetEvent {
  /** Event category. */
  type: 'submit' | 'action' | 'change' | 'select';
  /** The widget type that emitted this event. */
  widget: string;
  /** Widget instance `id` (if set in the spec). */
  id?: string;
  /** Action identifier (for `"action"` type events). */
  action?: string;
  /** Event payload data. */
  data?: Record<string, unknown>;
}

// ── Spec Envelope ──

/**
 * The u-widget spec envelope — a single, consistent structure for all widgets.
 *
 * Only `widget` is required. All other fields are optional or auto-inferred.
 *
 * @example
 * ```ts
 * const spec: UWidgetSpec = {
 *   widget: 'chart.bar',
 *   data: [{ name: 'A', value: 30 }, { name: 'B', value: 70 }],
 *   mapping: { x: 'name', y: 'value' },
 * };
 * ```
 */
export interface UWidgetSpec {
  /** Widget type identifier (e.g., `"chart.bar"`, `"metric"`, `"form"`). */
  widget: string;
  /** Unique identifier for event correlation and compose children. */
  id?: string;
  /** Optional display title rendered above the widget. */
  title?: string;
  /** Optional description text rendered below the title. */
  description?: string;
  /** Inline data — an object (metric/gauge) or array of records (chart/table). */
  data?: Record<string, unknown> | Record<string, unknown>[];
  /** Maps data fields to visual channels. Auto-inferred when omitted. */
  mapping?: UWidgetMapping;
  /** Field definitions for form/confirm widgets. */
  fields?: UWidgetFieldDefinition[];
  /** Formdown shorthand syntax for form fields (mutually exclusive with `fields`). */
  formdown?: string;
  /** Widget-specific rendering options. */
  options?: Record<string, unknown>;
  /** Action buttons displayed below the widget. */
  actions?: UWidgetAction[];
  /** Interchange format type marker. Always `"u-widget"` if present. */
  type?: 'u-widget';
  /** Interchange format version string. */
  version?: string;

  /** Layout mode for compose widget: `"stack"` (default), `"row"`, or `"grid"`. */
  layout?: 'stack' | 'row' | 'grid';
  /** Number of grid columns for compose `"grid"` layout. Default: 2. */
  columns?: number;
  /** Child widget specs for compose widget. */
  children?: UWidgetChildSpec[];

  /** Grid column span for children inside a compose `"grid"` layout. */
  span?: number;
}

/**
 * Child widget spec inside a compose widget.
 * Inherits `type` and `version` from the parent — no need to repeat them.
 */
export interface UWidgetChildSpec extends Omit<UWidgetSpec, 'type' | 'version'> {
  /** Grid column span within the parent compose layout. */
  span?: number;
}
