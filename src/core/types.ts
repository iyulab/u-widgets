// ── Widget Type Identifiers ──

export type ChartType =
  | 'chart.bar'
  | 'chart.line'
  | 'chart.area'
  | 'chart.pie'
  | 'chart.scatter'
  | 'chart.radar'
  | 'chart.heatmap'
  | 'chart.box';

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
  | 'compose';

// ── Mapping ──

export interface UWidgetColumnDefinition {
  field: string;
  label?: string;
  format?: 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'bytes';
  align?: 'left' | 'center' | 'right';
}

export interface UWidgetMapping {
  x?: string;
  y?: string | string[];
  label?: string;
  value?: string;
  color?: string;
  size?: string;
  axis?: string;
  columns?: UWidgetColumnDefinition[];
  primary?: string;
  secondary?: string;
  icon?: string;
  avatar?: string;
  trailing?: string;
}

// Normalized mapping: y is always string[]
export interface NormalizedMapping extends Omit<UWidgetMapping, 'y'> {
  y?: string[];
}

// ── Fields (Input Widgets) ──

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

export interface UWidgetFieldDefinition {
  field: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  maxLength?: number;
  rows?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
}

// ── Actions ──

export interface UWidgetAction {
  label: string;
  action: string;
  style?: 'primary' | 'danger' | 'default';
  disabled?: boolean;
  url?: string;
}

// ── Events ──

export interface UWidgetEvent {
  type: 'submit' | 'action' | 'change' | 'select';
  widget: string;
  id?: string;
  action?: string;
  data?: Record<string, unknown>;
}

// ── Spec Envelope ──

export interface UWidgetSpec {
  widget: string;
  id?: string;
  title?: string;
  description?: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  mapping?: UWidgetMapping;
  fields?: UWidgetFieldDefinition[];
  formdown?: string;
  options?: Record<string, unknown>;
  actions?: UWidgetAction[];
  type?: 'u-widget';
  version?: string;

  // compose-specific
  layout?: 'stack' | 'row' | 'grid';
  columns?: number;
  children?: UWidgetChildSpec[];

  // child-specific
  span?: number;
}

export interface UWidgetChildSpec extends Omit<UWidgetSpec, 'type' | 'version'> {
  span?: number;
}
