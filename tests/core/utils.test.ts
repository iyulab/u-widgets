import { describe, it, expect } from 'vitest';
import { isDateLikeString } from '../../src/core/utils.js';

describe('isDateLikeString', () => {
  it('detects ISO 8601 date', () => {
    expect(isDateLikeString('2024-01-15')).toBe(true);
    expect(isDateLikeString('2024-01-15T10:30:00Z')).toBe(true);
  });

  it('detects MM/DD/YYYY', () => {
    expect(isDateLikeString('01/15/2024')).toBe(true);
    expect(isDateLikeString('1/5/2024')).toBe(true);
  });

  it('detects YYYY/MM/DD', () => {
    expect(isDateLikeString('2024/01/15')).toBe(true);
  });

  it('detects month names', () => {
    expect(isDateLikeString('Jan 2024')).toBe(true);
    expect(isDateLikeString('February 15, 2024')).toBe(true);
    expect(isDateLikeString('dec 2023')).toBe(true);
  });

  it('rejects non-date strings', () => {
    expect(isDateLikeString('hello world')).toBe(false);
    expect(isDateLikeString('12345')).toBe(false);
    expect(isDateLikeString('')).toBe(false);
  });

  it('rejects very short strings', () => {
    expect(isDateLikeString('abc')).toBe(false);
  });

  it('rejects very long strings', () => {
    expect(isDateLikeString('a'.repeat(31))).toBe(false);
  });
});
