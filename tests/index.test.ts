// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getPrimaryDataField } from '../src/index.js';

describe('public entry (src/index.ts)', () => {
  it('exposes getPrimaryDataField', () => {
    expect(getPrimaryDataField('gauge')).toBe('value');
  });
});
