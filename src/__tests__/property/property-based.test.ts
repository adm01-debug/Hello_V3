import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Property-based Tests', () => {
  describe('InputSanitizer', () => {
    it('should always return a string', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = sanitizeString(input);
          expect(typeof result).toBe('string');
        })
      );
    });

    it('should not contain script tags', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = sanitizeHTML(input);
          expect(result).not.toContain('<script');
          expect(result).not.toContain('</script>');
        })
      );
    });

    it('should handle special characters safely', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (input) => {
            const result = sanitizeString(input);
            // Should not throw
            expect(() => JSON.parse(JSON.stringify(result))).not.toThrow();
          }
        )
      );
    });
  });

  describe('EmailValidator', () => {
    it('should reject invalid emails', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('@')),
          (email) => {
            expect(validateEmail(email)).toBe(false);
          }
        )
      );
    });

    it('should validate proper email format', () => {
      const emailGenerator = fc.tuple(
        fc.stringOf(fc.char().filter(c => c !== '@'), { minLength: 1 }),
        fc.constant('@'),
        fc.stringOf(fc.char().filter(c => c !== '@' && c !== '.'), { minLength: 1 }),
        fc.constant('.'),
        fc.stringOf(fc.char().filter(c => c !== '@' && c !== '.'), { minLength: 2, maxLength: 5 })
      ).map(parts => parts.join(''));

      fc.assert(
        fc.property(emailGenerator, (email) => {
          const result = validateEmail(email);
          expect(typeof result).toBe('boolean');
        })
      );
    });
  });

  describe('ArrayUtils', () => {
    it('should maintain array length after sort', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const sorted = sortArray(arr);
          expect(sorted.length).toBe(arr.length);
        })
      );
    });

    it('should produce sorted array', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const sorted = sortArray(arr);
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i]).toBeLessThanOrEqual(sorted[i + 1]);
          }
        })
      );
    });

    it('should be idempotent', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const sorted1 = sortArray(arr);
          const sorted2 = sortArray(sorted1);
          expect(sorted1).toEqual(sorted2);
        })
      );
    });
  });

  describe('DateUtils', () => {
    it('should handle any valid timestamp', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: Date.now() }), (timestamp) => {
          const result = formatDate(new Date(timestamp));
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        })
      );
    });

    it('should be consistent', () => {
      fc.assert(
        fc.property(fc.date(), (date) => {
          const result1 = formatDate(date);
          const result2 = formatDate(date);
          expect(result1).toBe(result2);
        })
      );
    });
  });
});

// Stub functions (replace with actual implementations)
function sanitizeString(input: string): string {
  return input.replace(/[<>]/g, '');
}

function sanitizeHTML(input: string): string {
  return input.replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sortArray(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

function formatDate(date: Date): string {
  return date.toISOString();
}
