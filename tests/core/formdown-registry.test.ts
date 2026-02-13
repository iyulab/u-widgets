import { describe, it, expect, afterEach } from 'vitest';
import {
  registerFormdownParser,
  getFormdownParser,
  parseFormdown,
} from '../../src/core/formdown.js';
import { normalize } from '../../src/core/normalize.js';
import type { FormdownParser } from '../../src/core/formdown.js';

describe('formdown parser registry', () => {
  afterEach(() => {
    // Reset registry to built-in parser
    registerFormdownParser(null as unknown as FormdownParser);
  });

  it('returns built-in parser by default', () => {
    const parser = getFormdownParser();
    expect(parser).toBe(parseFormdown);
  });

  it('returns external parser when registered', () => {
    const custom: FormdownParser = (_input) => ({
      fields: [{ field: 'custom', type: 'text' }],
      actions: [],
    });
    registerFormdownParser(custom);
    expect(getFormdownParser()).toBe(custom);
  });

  it('falls back to built-in after clearing', () => {
    const custom: FormdownParser = () => ({ fields: [], actions: [] });
    registerFormdownParser(custom);
    registerFormdownParser(null as unknown as FormdownParser);
    expect(getFormdownParser()).toBe(parseFormdown);
  });
});

describe('normalize with registry', () => {
  afterEach(() => {
    registerFormdownParser(null as unknown as FormdownParser);
  });

  it('uses built-in parser by default', () => {
    const spec = normalize({
      widget: 'form',
      formdown: '@name: []',
    });
    expect(spec.fields).toEqual([{ field: 'name', type: 'text' }]);
  });

  it('uses registered external parser', () => {
    const custom: FormdownParser = (_input, data) => ({
      fields: [{ field: 'ext', type: 'email', placeholder: data?.hint as string }],
      actions: [{ action: 'submit', label: 'Go', style: 'primary' }],
    });
    registerFormdownParser(custom);

    const spec = normalize({
      widget: 'form',
      formdown: '@email: @[]',
      data: { hint: 'Enter email' },
    });
    expect(spec.fields).toEqual([
      { field: 'ext', type: 'email', placeholder: 'Enter email' },
    ]);
    expect(spec.actions).toEqual([
      { action: 'submit', label: 'Go', style: 'primary' },
    ]);
  });

  it('passes spec.data to parser', () => {
    let receivedData: Record<string, unknown> | undefined;
    const spy: FormdownParser = (_input, data) => {
      receivedData = data;
      return { fields: [], actions: [] };
    };
    registerFormdownParser(spy);

    normalize({
      widget: 'form',
      formdown: '@x: []',
      data: { key: 'value' },
    });
    expect(receivedData).toEqual({ key: 'value' });
  });

  it('does not overwrite existing fields', () => {
    const custom: FormdownParser = () => ({
      fields: [{ field: 'wrong', type: 'text' }],
      actions: [],
    });
    registerFormdownParser(custom);

    const spec = normalize({
      widget: 'form',
      formdown: '@x: []',
      fields: [{ field: 'keep', type: 'email' }],
    });
    expect(spec.fields).toEqual([{ field: 'keep', type: 'email' }]);
  });

  it('does not overwrite existing actions', () => {
    const custom: FormdownParser = () => ({
      fields: [{ field: 'f', type: 'text' }],
      actions: [{ action: 'submit', label: 'New', style: 'primary' }],
    });
    registerFormdownParser(custom);

    const spec = normalize({
      widget: 'form',
      formdown: '@f: []',
      actions: [{ action: 'cancel', label: 'Keep', style: 'default' }],
    });
    expect(spec.actions).toEqual([
      { action: 'cancel', label: 'Keep', style: 'default' },
    ]);
  });
});
