import { describe, it, expect } from 'vitest';
import { cn, formatDuration, formatDurationFriendly, formatCurrency, formatNumber } from '../utils';

describe('utils (coverage)', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('a', 'b')).toBe('a b');
    });
    it('dedups tailwind conflicts', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });
    it('handles conditional / falsy values', () => {
      expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds into mm:ss', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3661)).toBe('61:01');
    });
    it('handles null/undefined/negative', () => {
      expect(formatDuration(null)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
      expect(formatDuration(-10)).toBe('0:00');
    });
  });

  describe('formatDurationFriendly', () => {
    it('handles null/undefined/negative', () => {
      expect(formatDurationFriendly(null)).toBe('0s');
      expect(formatDurationFriendly(undefined)).toBe('0s');
      expect(formatDurationFriendly(-1)).toBe('0s');
    });
    it('formats sub-minute', () => {
      expect(formatDurationFriendly(30)).toBe('30s');
      expect(formatDurationFriendly(0)).toBe('0s');
    });
    it('formats minutes and seconds', () => {
      expect(formatDurationFriendly(90)).toBe('1m 30s');
      expect(formatDurationFriendly(125)).toBe('2m 5s');
    });
    it('formats hours and minutes', () => {
      expect(formatDurationFriendly(3600)).toBe('1h 0m');
      expect(formatDurationFriendly(8100)).toBe('2h 15m');
    });
  });

  describe('formatCurrency', () => {
    it('formats BRL', () => {
      const out = formatCurrency(1234.5);
      expect(out).toContain('1.234,50');
      expect(out).toMatch(/R\$/);
    });
  });

  describe('formatNumber', () => {
    it('formats with thousands separators', () => {
      expect(formatNumber(1234567)).toBe('1.234.567');
      expect(formatNumber(0)).toBe('0');
    });
  });
});
