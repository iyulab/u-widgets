import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerLocale,
  getLocaleStrings,
  formatTemplate,
  getDefaultLocale,
} from '../../src/core/locale.js';

describe('locale', () => {
  describe('getDefaultLocale', () => {
    it('returns English defaults', () => {
      const en = getDefaultLocale();
      expect(en.prev).toBe('Prev');
      expect(en.next).toBe('Next');
      expect(en.required).toBe('{label} is required');
    });

    it('returns a copy (not mutable reference)', () => {
      const a = getDefaultLocale();
      const b = getDefaultLocale();
      a.prev = 'modified';
      expect(b.prev).toBe('Prev');
    });
  });

  describe('getLocaleStrings', () => {
    it('returns English when lang is undefined', () => {
      const strings = getLocaleStrings(undefined);
      expect(strings.prev).toBe('Prev');
    });

    it('returns English when lang is not registered', () => {
      const strings = getLocaleStrings('fr');
      expect(strings.prev).toBe('Prev');
    });
  });

  describe('registerLocale', () => {
    it('registers and retrieves a locale', () => {
      registerLocale('ko', { prev: '이전', next: '다음' });
      const strings = getLocaleStrings('ko');
      expect(strings.prev).toBe('이전');
      expect(strings.next).toBe('다음');
    });

    it('merges with English defaults for partial registration', () => {
      registerLocale('ja', { prev: '前へ' });
      const strings = getLocaleStrings('ja');
      expect(strings.prev).toBe('前へ');
      expect(strings.next).toBe('Next'); // English fallback
    });

    it('resolves case-insensitively', () => {
      registerLocale('DE', { prev: 'Zurück' });
      expect(getLocaleStrings('de').prev).toBe('Zurück');
      expect(getLocaleStrings('DE').prev).toBe('Zurück');
    });

    it('resolves base language from full tag (ko-KR → ko)', () => {
      registerLocale('ko', { prev: '이전' });
      const strings = getLocaleStrings('ko-KR');
      expect(strings.prev).toBe('이전');
    });

    it('prefers exact match over base language', () => {
      registerLocale('zh', { prev: '上一页' });
      registerLocale('zh-tw', { prev: '上一頁' });
      expect(getLocaleStrings('zh-TW').prev).toBe('上一頁');
      expect(getLocaleStrings('zh').prev).toBe('上一页');
    });
  });

  describe('formatTemplate', () => {
    it('replaces single placeholder', () => {
      expect(formatTemplate('{label} is required', { label: 'Name' }))
        .toBe('Name is required');
    });

    it('replaces multiple placeholders', () => {
      expect(formatTemplate('{label} must be at least {min}', { label: 'Age', min: 18 }))
        .toBe('Age must be at least 18');
    });

    it('keeps unreplaced placeholders', () => {
      expect(formatTemplate('{label} {unknown}', { label: 'X' }))
        .toBe('X {unknown}');
    });

    it('handles empty params', () => {
      expect(formatTemplate('no placeholders', {})).toBe('no placeholders');
    });
  });
});
