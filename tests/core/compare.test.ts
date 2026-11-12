// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { compareText, setTextComparer } from '../../src/core/compare.js';

describe('compareText — how a table orders two texts', () => {
  afterEach(() => setTextComparer(undefined));

  it('reads digit runs as numbers — A-2 before A-10', () => {
    expect(compareText('A-2', 'A-10', 'en')).toBeLessThan(0);
    expect(compareText('9', '10', 'en')).toBeLessThan(0);
  });

  it('treats case and diacritics as the same letter', () => {
    expect(compareText('abc', 'ABC', 'en')).toBe(0);
    expect(compareText('resume', 'résumé', 'en')).toBe(0);
  });

  it('follows the locale it is given for where Hangul sits among Latin letters', () => {
    expect(compareText('가나다', 'banana', 'ko')).toBeLessThan(0);
    expect(compareText('가나다', 'banana', 'en')).toBeGreaterThan(0);
  });

  it('does not throw on a malformed locale tag', () => {
    expect(() => compareText('a', 'b', 'ko_KR')).not.toThrow();
    expect(compareText('A-2', 'A-10', 'ko_KR')).toBeLessThan(0);
  });

  it('hands the comparison to the registered comparer, with the locale', () => {
    const seen: Array<[string, string, string | undefined]> = [];
    setTextComparer((a, b, locale) => {
      seen.push([a, b, locale]);
      return 7;
    });
    expect(compareText('x', 'y', 'de')).toBe(7);
    expect(seen).toEqual([['x', 'y', 'de']]);
    setTextComparer(undefined);
    expect(compareText('x', 'y', 'de')).toBeLessThan(0);
  });
});
