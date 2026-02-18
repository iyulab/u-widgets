import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const schemaPath = resolve(__dirname, '../../schema/u-widget.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

describe('u-widget.schema.json', () => {
  it('is valid JSON', () => {
    expect(schema).toBeDefined();
    expect(schema.$schema).toContain('json-schema.org');
  });

  it('has correct title and version', () => {
    expect(schema.title).toBe('u-widget');
    expect(schema.description).toContain('v0.2');
  });

  it('defines widgetType enum with all known types', () => {
    const widgetType = schema.$defs.widgetType;
    expect(widgetType.type).toBe('string');
    const types: string[] = widgetType.enum;

    // Display widgets
    expect(types).toContain('metric');
    expect(types).toContain('stat-group');
    expect(types).toContain('gauge');
    expect(types).toContain('progress');

    // Data widgets
    expect(types).toContain('table');
    expect(types).toContain('list');

    // Chart widgets
    expect(types).toContain('chart.bar');
    expect(types).toContain('chart.line');
    expect(types).toContain('chart.area');
    expect(types).toContain('chart.pie');
    expect(types).toContain('chart.scatter');
    expect(types).toContain('chart.radar');
    expect(types).toContain('chart.heatmap');
    expect(types).toContain('chart.box');
    expect(types).toContain('chart.funnel');
    expect(types).toContain('chart.waterfall');
    expect(types).toContain('chart.treemap');

    // Input widgets
    expect(types).toContain('form');
    expect(types).toContain('confirm');

    // Content widgets
    expect(types).toContain('markdown');
    expect(types).toContain('image');
    expect(types).toContain('callout');
  });

  it('widget def references widgetType', () => {
    const widgetProp = schema.$defs.widget.properties.widget;
    expect(widgetProp.$ref).toBe('#/$defs/widgetType');
  });

  it('fieldDefinition includes all field types from types.ts', () => {
    const fieldTypes: string[] = schema.$defs.fieldDefinition.properties.type.enum;
    const expected = [
      'text', 'email', 'password', 'tel', 'url',
      'textarea', 'number', 'select', 'multiselect',
      'date', 'datetime', 'time',
      'toggle', 'range', 'radio', 'checkbox',
    ];
    for (const t of expected) {
      expect(fieldTypes).toContain(t);
    }
  });

  it('fieldDefinition has message property', () => {
    const props = schema.$defs.fieldDefinition.properties;
    expect(props.message).toBeDefined();
    expect(props.message.type).toBe('string');
  });

  it('mapping includes avatar and trailing', () => {
    const props = schema.$defs.mapping.properties;
    expect(props.avatar).toBeDefined();
    expect(props.trailing).toBeDefined();
  });

  it('compose widget requires children', () => {
    const required = schema.$defs.composeWidget.required;
    expect(required).toContain('children');
    expect(required).toContain('widget');
  });

  it('compose layout enum matches code', () => {
    const layoutEnum: string[] = schema.$defs.composeWidget.properties.layout.enum;
    expect(layoutEnum).toEqual(['stack', 'row', 'grid']);
  });

  it('action requires label and action', () => {
    const required = schema.$defs.action.required;
    expect(required).toContain('label');
    expect(required).toContain('action');
  });

  it('action style enum matches types.ts', () => {
    const styleEnum: string[] = schema.$defs.action.properties.style.enum;
    expect(styleEnum).toEqual(['primary', 'danger', 'default']);
  });
});
