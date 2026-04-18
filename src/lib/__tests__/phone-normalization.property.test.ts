import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeBrPhone, isE164, maskPhone, stripNonDigits } from '@/lib/phone-normalization';

describe('phone-normalization — property-based (1000+ runs)', () => {
  it('stripNonDigits preserva apenas dígitos (e + inicial)', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const out = stripNonDigits(s);
        const body = out.startsWith('+') ? out.slice(1) : out;
        return /^\d*$/.test(body);
      }),
      { numRuns: 1000, seed: 42 },
    );
  });

  it('normalizeBrPhone aceita 10-11 dígitos crus e prefixa +55', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 11 }).chain((len) =>
          fc.stringMatching(new RegExp(`^[1-9]\\d{${len - 1}}$`)),
        ),
        (digits) => {
          const out = normalizeBrPhone(digits);
          return out === `+55${digits}`;
        },
      ),
      { numRuns: 500, seed: 7 },
    );
  });

  it('normalizeBrPhone rejeita strings não numéricas longas', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z]{5,20}$/),
        (s) => normalizeBrPhone(s) === null,
      ),
      { numRuns: 500, seed: 11 },
    );
  });

  it('isE164 reconhece saída de normalizeBrPhone', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[1-9]\d{9,10}$/),
        (raw) => {
          const norm = normalizeBrPhone(raw);
          return norm !== null && isE164(norm);
        },
      ),
      { numRuns: 500, seed: 23 },
    );
  });

  it('maskPhone preserva últimos 4 dígitos quando há ≥4 dígitos', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\d{4,15}$/),
        (digits) => {
          const masked = maskPhone(digits);
          return masked.endsWith(digits.slice(-4));
        },
      ),
      { numRuns: 500, seed: 31 },
    );
  });

  it('inputs vazios/inválidos retornam null em normalizeBrPhone', () => {
    expect(normalizeBrPhone('')).toBeNull();
    expect(normalizeBrPhone('abc')).toBeNull();
    expect(normalizeBrPhone('123')).toBeNull();
    expect(normalizeBrPhone('123456789012345678')).toBeNull();
  });

  it('isE164 rejeita formatos malformados', () => {
    expect(isE164('1234567890')).toBe(false);
    expect(isE164('+0123456789')).toBe(false);
    expect(isE164('+1')).toBe(false);
    expect(isE164('++5511999999999')).toBe(false);
  });
});
