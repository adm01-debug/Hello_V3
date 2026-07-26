import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { describeFavorite, maskPhone } from '@/lib/favorite-sync-labels';

describe('maskPhone', () => {
  it('preserva apenas os últimos dígitos', () => {
    expect(maskPhone('+55 11 98765-4321')).toBe('••••4321');
    expect(maskPhone('12')).toBe('••••12');
    expect(maskPhone('abc')).toBe('número desconhecido');
    expect(maskPhone(null)).toBe('número desconhecido');
  });

  it('nunca vaza mais de 4 dígitos (PBT)', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const masked = maskPhone(raw);
        const digits = masked.replace(/\D/g, '');
        expect(digits.length).toBeLessThanOrEqual(4);
        expect(masked.length).toBeGreaterThan(0);
      }),
      { numRuns: 700, seed: 7 },
    );
  });
});

describe('describeFavorite', () => {
  it('prefere o rótulo e limita o tamanho (PBT)', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (label, phone) => {
        const out = describeFavorite(label, phone);
        expect(typeof out).toBe('string');
        expect(out.length).toBeGreaterThan(0);
        expect(out.length).toBeLessThanOrEqual(40);
      }),
      { numRuns: 700, seed: 11 },
    );
  });
});
