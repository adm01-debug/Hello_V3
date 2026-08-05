/**
 * Simulação massiva (PBT + cenários hostis) para `safe-date`.
 * Cobre entradas nulas, strings arbitrárias, números fora do range de Date,
 * timezones exóticos e máscaras diversas — garantindo que a função nunca
 * lance `RangeError: Invalid time value`.
 */
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  safeFormatDate,
  safeFormatDatePtBR,
  safeFormatDistanceToNow,
  safeToLocaleDateString,
  safeToLocaleString,
  safeToLocaleTimeString,
} from "@/lib/safe-date";

describe("safe-date · entradas hostis nunca lançam", () => {
  it("PBT: qualquer string arbitrária é tolerada", () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom("dd/MM/yyyy", "HH:mm:ss", "yyyy-MM-dd'T'HH:mm:ssXXX"), (s, mask) => {
        expect(() => safeFormatDate(s, mask)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it("PBT: qualquer número (inclui NaN, ±Infinity, valores fora do range) é tolerado", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double(),
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity),
          fc.constant(Number.MAX_SAFE_INTEGER),
          fc.constant(Number.MIN_SAFE_INTEGER),
        ),
        (n) => {
          expect(() => safeFormatDate(n, "dd/MM/yyyy")).not.toThrow();
        },
      ),
      { numRuns: 300 },
    );
  });

  it("null / undefined / '' retornam fallback padrão '—'", () => {
    expect(safeFormatDate(null, "dd/MM")).toBe("—");
    expect(safeFormatDate(undefined, "dd/MM")).toBe("—");
    expect(safeFormatDate("", "dd/MM")).toBe("—");
  });

  it("fallback customizado é respeitado", () => {
    expect(safeFormatDate(null, "dd/MM", { fallback: "n/d" })).toBe("n/d");
    expect(safeFormatDate("garbage", "dd/MM", { fallback: "err" })).toBe("err");
  });

  it("data válida em ISO produz string formatada", () => {
    expect(safeFormatDate("2025-06-15T00:00:00Z", "yyyy-MM-dd")).toMatch(/^2025-06-1[45]$/);
  });

  it("safeFormatDatePtBR aplica locale ptBR", () => {
    // "MMMM" em ptBR produz "junho"; en-US produziria "June".
    const out = safeFormatDatePtBR("2025-06-15T12:00:00Z", "MMMM");
    expect(out.toLowerCase()).toContain("junho");
  });

  it("aceita instância de Date válida e inválida", () => {
    expect(safeFormatDate(new Date("2025-01-01T00:00:00Z"), "yyyy")).toBe("2025");
    expect(safeFormatDate(new Date("garbage"), "yyyy")).toBe("—");
  });

  it("máscaras exóticas não lançam", () => {
    for (const mask of ["", "'lit'", "yyyy 'às' HH:mm", "T"]) {
      expect(() => safeFormatDate("2025-06-15T12:00:00Z", mask)).not.toThrow();
    }
  });
});

describe("safe-date · wrappers auxiliares nunca lançam", () => {
  const hostileInputs = fc.oneof(
    fc.string(),
    fc.constant(null),
    fc.constant(undefined),
    fc.constant(""),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity),
    fc.double(),
    fc.date().map((d) => d.toISOString()),
  );

  it("PBT: safeFormatDistanceToNow tolera qualquer entrada", () => {
    fc.assert(
      fc.property(hostileInputs, (v) => {
        expect(() => safeFormatDistanceToNow(v as never)).not.toThrow();
      }),
      { numRuns: 400 },
    );
  });

  it("PBT: safeToLocale* tolera qualquer entrada", () => {
    fc.assert(
      fc.property(hostileInputs, (v) => {
        expect(() => safeToLocaleString(v as never, "pt-BR")).not.toThrow();
        expect(() => safeToLocaleDateString(v as never, "pt-BR")).not.toThrow();
        expect(() => safeToLocaleTimeString(v as never, "pt-BR")).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });

  it("valores válidos produzem output plausível", () => {
    expect(safeFormatDistanceToNow(new Date(Date.now() - 60_000))).toMatch(/minute|minuto/i);
    expect(safeToLocaleDateString("2025-06-15T00:00:00Z", "pt-BR")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(safeToLocaleTimeString("2025-06-15T12:34:56Z", "pt-BR")).toMatch(/\d{2}:\d{2}/);
  });

  it("null/undefined/'' retornam fallback nos wrappers auxiliares", () => {
    for (const v of [null, undefined, ""] as const) {
      expect(safeFormatDistanceToNow(v)).toBe("—");
      expect(safeToLocaleString(v)).toBe("—");
      expect(safeToLocaleDateString(v)).toBe("—");
      expect(safeToLocaleTimeString(v)).toBe("—");
    }
  });
});
