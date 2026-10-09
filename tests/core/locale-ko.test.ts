// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getDefaultLocale, getLocaleStrings } from '../../src/core/locale.js';
import { ko } from '../../src/locales/ko.js';

const placeholders = (template: string) => [...template.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

describe('Korean locale bundle', () => {
  it('registers itself as ko on import, for ko and ko-KR alike', () => {
    expect(getLocaleStrings('ko').status).toBe('상태');
    expect(getLocaleStrings('ko-KR').previousPage).toBe('이전 페이지');
    expect(getLocaleStrings('en').status).toBe('Status');
  });

  it('translates every string, keeping each template\'s placeholders', () => {
    const en = getDefaultLocale();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(ko[key], key).toBeTruthy();
      expect(placeholders(ko[key]), key).toEqual(placeholders(en[key]));
    }
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
  });
});
