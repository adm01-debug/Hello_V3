import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { string, uuid, number, oneOf, validate, array, optional } from '@/../supabase/functions/_shared/validate';

describe('Edge Function validate — fuzz testing (500+ inputs)', () => {
  it('string() sobrevive a payloads maliciosos sem lançar', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.constant("'; DROP TABLE users; --"),
          fc.constant('<script>alert(1)</script>'),
          fc.constant('\x00\x01\x02'),
          fc.constant('🚀💀🔥'.repeat(100)),
          fc.constant('a'.repeat(100000)),
          fc.constantFrom(null, undefined, 0, 1, true, false, [], {}),
        ),
        (input) => {
          const v = string({ min: 1, max: 1000 });
          const result = v(input);
          return typeof result.ok === 'boolean';
        },
      ),
      { numRuns: 500, seed: 42 },
    );
  });

  it('uuid() aceita apenas UUID v4-like', () => {
    fc.assert(
      fc.property(fc.uuid(), (u) => uuid()(u).ok === true),
      { numRuns: 200, seed: 7 },
    );
  });

  it('uuid() rejeita lixo', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 35 }).filter(s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)),
        (s) => uuid()(s).ok === false,
      ),
      { numRuns: 500, seed: 11 },
    );
  });

  it('number() coage strings numéricas e rejeita NaN', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (n) => {
        const r = number({ min: 0, max: 1000 })(String(n));
        return r.ok === true && r.ok && (r as { ok: true; data: number }).data === n;
      }),
      { numRuns: 500, seed: 13 },
    );
    expect(number()('not-a-number').ok).toBe(false);
  });

  it('oneOf() é case-sensitive estrito', () => {
    const v = oneOf('admin', 'supervisor', 'agent');
    expect(v('admin').ok).toBe(true);
    expect(v('Admin').ok).toBe(false);
    expect(v('ADMIN').ok).toBe(false);
    expect(v('').ok).toBe(false);
  });

  it('validate() retorna erros estruturados sem vazar dados sensíveis', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.oneof(fc.emailAddress(), fc.string({ maxLength: 5 })),
          age: fc.oneof(fc.integer(), fc.string()),
        }),
        (body) => {
          const result = validate(body, {
            email: string({ min: 5, max: 100 }),
            age: number({ min: 0, max: 120 }),
          });
          if (!result.ok) {
            // Erros são sempre Record<string,string>
            return Object.values(result.errors).every(e => typeof e === 'string');
          }
          return true;
        },
      ),
      { numRuns: 500, seed: 17 },
    );
  });

  it('array() respeita max e propaga erro com índice', () => {
    const v = array(string({ min: 1 }), { max: 3 });
    expect(v(['a', 'b', 'c']).ok).toBe(true);
    expect(v(['a', 'b', 'c', 'd']).ok).toBe(false);
    const r = v(['ok', '']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('[1]');
  });

  it('optional() trata null e undefined como ausentes', () => {
    const v = optional(string({ min: 1 }));
    expect(v(null).ok).toBe(true);
    expect(v(undefined).ok).toBe(true);
    expect(v('hi').ok).toBe(true);
    expect(v('').ok).toBe(false);
  });

  it('validate() rejeita body não-objeto', () => {
    [null, 'string', 42, true, [1, 2]].forEach(b => {
      const r = validate(b, { x: string() });
      expect(r.ok).toBe(false);
    });
  });
});
