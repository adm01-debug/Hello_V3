/**
 * Simulação massiva (PBT + cenários hostis) para `safe-number`.
 * Garante que entradas corrompidas nunca resultem em `NaN` propagado
 * ao estado da aplicação.
 */
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  safeParseFloat,
  safeParseInt,
  safeToFixed,
} from "@/lib/safe-number";

const hostileInputs = fc.oneof(
  fc.string(),
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.constant("   "),
  fc.constant("NaN"),
  fc.constant("abc"),
  fc.constant("12abc"),
  fc.constant("Infinity"),
  fc.constant("-Infinity"),
);

describe("safe-number · safeParseInt", () => {
  it("PBT: nunca retorna NaN, mesmo com entrada hostil", () => {
    fc.assert(
      fc.property(hostileInputs, (v) => {
        const r = safeParseInt(v as never);
        expect(Number.isFinite(r)).toBe(true);
        expect(Number.isNaN(r)).toBe(false);
      }),
      { numRuns: 500, seed: 42 },
    );
  });

  it("PBT: números válidos são truncados", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: 1_000_000 }), (n) => {
        expect(safeParseInt(String(n))).toBe(n);
        expect(safeParseInt(n)).toBe(n);
      }),
      { numRuns: 300, seed: 7 },
    );
  });

  it("PBT: respeita min/max clamp", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 100, max: 500 }),
        (v, min, max) => {
          const r = safeParseInt(v, { min, max });
          expect(r).toBeGreaterThanOrEqual(min);
          expect(r).toBeLessThanOrEqual(max);
        },
      ),
      { numRuns: 300, seed: 13 },
    );
  });

  it("fallback customizado funciona", () => {
    expect(safeParseInt("garbage", { fallback: 42 })).toBe(42);
    expect(safeParseInt(null, { fallback: -1 })).toBe(-1);
    expect(safeParseInt("", { fallback: 999 })).toBe(999);
  });

  it("trunca decimais", () => {
    expect(safeParseInt("3.9")).toBe(3);
    expect(safeParseInt("-3.9")).toBe(-3);
  });

  it("rejeita strings mistas (Number-strict)", () => {
    expect(safeParseInt("12abc", { fallback: 0 })).toBe(0);
  });
});

describe("safe-number · safeParseFloat", () => {
  it("PBT: nunca retorna NaN com entrada hostil", () => {
    fc.assert(
      fc.property(hostileInputs, (v) => {
        const r = safeParseFloat(v as never);
        expect(Number.isFinite(r)).toBe(true);
      }),
      { numRuns: 500, seed: 42 },
    );
  });

  it("PBT: doubles finitos são preservados", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          expect(safeParseFloat(String(n))).toBeCloseTo(n, 6);
        },
      ),
      { numRuns: 300, seed: 7 },
    );
  });

  it("Infinity e -Infinity caem no fallback", () => {
    expect(safeParseFloat("Infinity")).toBe(0);
    expect(safeParseFloat(Infinity, { fallback: 99 })).toBe(99);
    expect(safeParseFloat(-Infinity, { fallback: 99 })).toBe(99);
  });

  it("clamp min/max", () => {
    expect(safeParseFloat("5.5", { min: 0, max: 3 })).toBe(3);
    expect(safeParseFloat("-2", { min: 0, max: 10 })).toBe(0);
  });
});

describe("safe-number · safeToFixed", () => {
  it("PBT: nunca retorna NaN", () => {
    fc.assert(
      fc.property(hostileInputs, fc.integer({ min: 0, max: 10 }), (v, d) => {
        const r = safeToFixed(v as never, d);
        expect(Number.isFinite(r)).toBe(true);
      }),
      { numRuns: 400, seed: 42 },
    );
  });

  it("arredonda corretamente", () => {
    expect(safeToFixed(1.2345, 2)).toBe(1.23);
    expect(safeToFixed("1.5", 0)).toBe(2);
    expect(safeToFixed(null, 2, 99)).toBe(99);
  });
});
