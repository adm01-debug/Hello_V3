/**
 * Simulação massiva (PBT + cenários hostis) para `safe-date`.
 * Cobre entradas nulas, strings arbitrárias, números fora do range de Date,
 * timezones exóticos e máscaras diversas — garantindo que a função nunca
 * lance `RangeError: Invalid time value`.
 */
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { safeFormatDate, safeFormatDatePtBR } from "@/lib/safe-date";

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
