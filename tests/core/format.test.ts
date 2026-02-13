import { describe, it, expect } from 'vitest';
import { formatValue } from '../../src/core/format.js';

describe('formatValue', () => {
  it('returns empty string for null', () => {
    expect(formatValue(null)).toBe('');
    expect(formatValue(undefined)).toBe('');
  });

  it('returns string as-is when no format', () => {
    expect(formatValue('hello')).toBe('hello');
    expect(formatValue(42)).toBe('42');
  });

  describe('number', () => {
    it('formats with thousand separator', () => {
      expect(formatValue(1234, 'number')).toBe('1,234');
      expect(formatValue(1234567, 'number')).toBe('1,234,567');
    });

    it('handles non-numeric', () => {
      expect(formatValue('abc', 'number')).toBe('abc');
    });
  });

  describe('currency', () => {
    it('adds won sign and formats', () => {
      expect(formatValue(1234, 'currency')).toBe('\u20A91,234');
    });
  });

  describe('percent', () => {
    it('adds percent sign', () => {
      expect(formatValue(73, 'percent')).toBe('73%');
    });
  });

  describe('date', () => {
    it('extracts date part from ISO string', () => {
      expect(formatValue('2025-01-15T14:30:00', 'date')).toBe('2025-01-15');
    });

    it('passes through non-date strings', () => {
      expect(formatValue('not-a-date', 'date')).toBe('not-a-date');
    });
  });

  describe('datetime', () => {
    it('extracts datetime part from ISO string', () => {
      expect(formatValue('2025-01-15T14:30:00', 'datetime')).toBe('2025-01-15 14:30');
    });
  });

  describe('bytes', () => {
    it('formats bytes', () => {
      expect(formatValue(500, 'bytes')).toBe('500 B');
    });

    it('formats kilobytes', () => {
      expect(formatValue(1536, 'bytes')).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatValue(1048576, 'bytes')).toBe('1.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatValue(1288490189, 'bytes')).toBe('1.2 GB');
    });

    it('formats zero bytes', () => {
      expect(formatValue(0, 'bytes')).toBe('0 B');
    });

    it('formats terabytes', () => {
      expect(formatValue(1099511627776, 'bytes')).toBe('1.0 TB');
    });

    it('handles non-numeric for bytes', () => {
      expect(formatValue('abc', 'bytes')).toBe('abc');
    });
  });

  describe('edge cases', () => {
    it('handles unknown format type as String()', () => {
      expect(formatValue(42, 'unknown')).toBe('42');
    });

    it('formats decimal percent', () => {
      expect(formatValue(73.5, 'percent')).toBe('73.5%');
    });

    it('handles non-numeric currency', () => {
      expect(formatValue('abc', 'currency')).toBe('abc');
    });

    it('formats date-only string', () => {
      expect(formatValue('2025-01-15', 'date')).toBe('2025-01-15');
    });

    it('handles numeric value for date format', () => {
      expect(formatValue(12345, 'date')).toBe('12345');
    });

    it('handles zero for number format', () => {
      expect(formatValue(0, 'number')).toBe('0');
    });

    it('formats negative number', () => {
      expect(formatValue(-1234, 'number')).toBe('-1,234');
    });

    it('formats negative bytes with correct unit', () => {
      expect(formatValue(-1536, 'bytes')).toBe('-1.5 KB');
    });
  });
});
